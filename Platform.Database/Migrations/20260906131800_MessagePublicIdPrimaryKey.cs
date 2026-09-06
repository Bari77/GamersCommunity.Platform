using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Platform.Database.Migrations
{
    /// <inheritdoc />
    public partial class MessagePublicIdPrimaryKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Messages_Parent",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_Messages_ParentMessageId",
                table: "Messages");

            migrationBuilder.AddColumn<Guid>(
                name: "ParentPublicId",
                table: "Messages",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE child
                SET child.ParentPublicId = parent.PublicId
                FROM Messages AS child
                INNER JOIN Messages AS parent ON parent.Id = child.ParentMessageId
                WHERE child.ParentMessageId IS NOT NULL;
                """);

            migrationBuilder.DropColumn(
                name: "ParentMessageId",
                table: "Messages");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Message",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_Messages_PublicId",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "Messages");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Message",
                table: "Messages",
                column: "PublicId")
                .Annotation("SqlServer:Clustered", false);

            migrationBuilder.CreateIndex(
                name: "IX_Messages_CreationDate_PublicId",
                table: "Messages",
                columns: new[] { "CreationDate", "PublicId" })
                .Annotation("SqlServer:Clustered", true);

            migrationBuilder.CreateIndex(
                name: "IX_Messages_ParentPublicId",
                table: "Messages",
                column: "ParentPublicId");

            migrationBuilder.AddForeignKey(
                name: "FK_Messages_Parent",
                table: "Messages",
                column: "ParentPublicId",
                principalTable: "Messages",
                principalColumn: "PublicId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Messages_Parent",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_Messages_ParentPublicId",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_Messages_CreationDate_PublicId",
                table: "Messages");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Message",
                table: "Messages");

            migrationBuilder.AddColumn<int>(
                name: "Id",
                table: "Messages",
                type: "int",
                nullable: false)
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddColumn<int>(
                name: "ParentMessageId",
                table: "Messages",
                type: "int",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE child
                SET child.ParentMessageId = parent.Id
                FROM Messages AS child
                INNER JOIN Messages AS parent ON parent.PublicId = child.ParentPublicId
                WHERE child.ParentPublicId IS NOT NULL;
                """);

            migrationBuilder.DropColumn(
                name: "ParentPublicId",
                table: "Messages");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Message",
                table: "Messages",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_PublicId",
                table: "Messages",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Messages_ParentMessageId",
                table: "Messages",
                column: "ParentMessageId");

            migrationBuilder.AddForeignKey(
                name: "FK_Messages_Parent",
                table: "Messages",
                column: "ParentMessageId",
                principalTable: "Messages",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
