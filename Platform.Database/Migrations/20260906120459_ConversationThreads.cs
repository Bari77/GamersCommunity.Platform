using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Platform.Database.Migrations
{
    /// <inheritdoc />
    public partial class ConversationThreads : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Messages_Receiver",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_Messages_IdReceiver",
                table: "Messages");

            migrationBuilder.CreateTable(
                name: "Conversations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PublicId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    CreationDate = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    ModificationDate = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    Kind = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    PictureUrl = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    IdOwner = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Conversation", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Conversation_Owner",
                        column: x => x.IdOwner,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ConversationMembers",
                columns: table => new
                {
                    IdConversation = table.Column<int>(type: "int", nullable: false),
                    IdUser = table.Column<int>(type: "int", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "datetime", nullable: false),
                    LastReadAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    IsOwner = table.Column<bool>(type: "bit", nullable: false),
                    CreationDate = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    ModificationDate = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConversationMembers", x => new { x.IdConversation, x.IdUser });
                    table.ForeignKey(
                        name: "FK_ConversationMember_Conversation",
                        column: x => x.IdConversation,
                        principalTable: "Conversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ConversationMember_User",
                        column: x => x.IdUser,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.AddColumn<int>(
                name: "IdConversation",
                table: "Messages",
                type: "int",
                nullable: true);

            migrationBuilder.Sql("""
                CREATE TABLE #Pairs (
                    Lo int NOT NULL,
                    Hi int NOT NULL,
                    Created datetime NOT NULL,
                    Modified datetime NOT NULL
                );

                INSERT INTO #Pairs (Lo, Hi, Created, Modified)
                SELECT
                    CASE WHEN IdSender < IdReceiver THEN IdSender ELSE IdReceiver END,
                    CASE WHEN IdSender < IdReceiver THEN IdReceiver ELSE IdSender END,
                    MIN(CreationDate),
                    MAX(ModificationDate)
                FROM Messages
                GROUP BY
                    CASE WHEN IdSender < IdReceiver THEN IdSender ELSE IdReceiver END,
                    CASE WHEN IdSender < IdReceiver THEN IdReceiver ELSE IdSender END;

                CREATE TABLE #Map (
                    ConversationId int NOT NULL,
                    Lo int NOT NULL,
                    Hi int NOT NULL
                );

                MERGE Conversations AS target
                USING #Pairs AS src
                ON 1 = 0
                WHEN NOT MATCHED THEN
                    INSERT (PublicId, Kind, Title, PictureUrl, IdOwner, CreationDate, ModificationDate)
                    VALUES (NEWID(), N'dm', NULL, NULL, NULL, src.Created, src.Modified)
                OUTPUT inserted.Id, src.Lo, src.Hi INTO #Map (ConversationId, Lo, Hi);

                UPDATE m
                SET m.IdConversation = map.ConversationId
                FROM Messages AS m
                INNER JOIN #Map AS map
                    ON map.Lo = CASE WHEN m.IdSender < m.IdReceiver THEN m.IdSender ELSE m.IdReceiver END
                   AND map.Hi = CASE WHEN m.IdSender < m.IdReceiver THEN m.IdReceiver ELSE m.IdSender END;

                INSERT INTO ConversationMembers (IdConversation, IdUser, JoinedAt, LastReadAt, IsOwner, CreationDate, ModificationDate)
                SELECT map.ConversationId, map.Lo, p.Created, p.Modified, 0, p.Created, p.Modified
                FROM #Map AS map
                INNER JOIN #Pairs AS p ON p.Lo = map.Lo AND p.Hi = map.Hi
                UNION ALL
                SELECT map.ConversationId, map.Hi, p.Created, p.Modified, 0, p.Created, p.Modified
                FROM #Map AS map
                INNER JOIN #Pairs AS p ON p.Lo = map.Lo AND p.Hi = map.Hi;

                UPDATE cm
                SET LastReadAt = CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM Messages AS m
                        WHERE m.IdConversation = cm.IdConversation
                          AND m.IdReceiver = cm.IdUser
                          AND m.IsRead = 0)
                    THEN ISNULL((
                        SELECT MAX(m.CreationDate)
                        FROM Messages AS m
                        WHERE m.IdConversation = cm.IdConversation
                          AND m.IdReceiver = cm.IdUser
                          AND m.IsRead = 1), cm.JoinedAt)
                    ELSE ISNULL((
                        SELECT MAX(m.CreationDate)
                        FROM Messages AS m
                        WHERE m.IdConversation = cm.IdConversation), cm.JoinedAt)
                END
                FROM ConversationMembers AS cm;
                """);

            migrationBuilder.Sql("""
                DELETE FROM Messages WHERE IdConversation IS NULL;
                """);

            migrationBuilder.AlterColumn<int>(
                name: "IdConversation",
                table: "Messages",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.DropColumn(
                name: "IsRead",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "IdReceiver",
                table: "Messages");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_IdConversation_CreationDate_PublicId",
                table: "Messages",
                columns: new[] { "IdConversation", "CreationDate", "PublicId" });

            migrationBuilder.CreateIndex(
                name: "IX_ConversationMembers_IdUser",
                table: "ConversationMembers",
                column: "IdUser");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_IdOwner",
                table: "Conversations",
                column: "IdOwner");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_PublicId",
                table: "Conversations",
                column: "PublicId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Messages_Conversation",
                table: "Messages",
                column: "IdConversation",
                principalTable: "Conversations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Messages_Conversation",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_Messages_IdConversation_CreationDate_PublicId",
                table: "Messages");

            migrationBuilder.AddColumn<int>(
                name: "IdReceiver",
                table: "Messages",
                type: "int",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE m
                SET m.IdReceiver = peer.IdUser
                FROM Messages AS m
                INNER JOIN ConversationMembers AS peer
                    ON peer.IdConversation = m.IdConversation
                   AND peer.IdUser <> m.IdSender;
                """);

            migrationBuilder.DropTable(
                name: "ConversationMembers");

            migrationBuilder.DropTable(
                name: "Conversations");

            migrationBuilder.DropColumn(
                name: "IdConversation",
                table: "Messages");

            migrationBuilder.AlterColumn<int>(
                name: "IdReceiver",
                table: "Messages",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsRead",
                table: "Messages",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Messages_IdReceiver",
                table: "Messages",
                column: "IdReceiver");

            migrationBuilder.AddForeignKey(
                name: "FK_Messages_Receiver",
                table: "Messages",
                column: "IdReceiver",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
