using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Platform.Database.Migrations
{
    /// <inheritdoc />
    public partial class ConversationManagedKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ManagedKey",
                table: "Conversations",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "UQ_Conversations_ManagedKey",
                table: "Conversations",
                column: "ManagedKey",
                unique: true,
                filter: "[ManagedKey] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UQ_Conversations_ManagedKey",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "ManagedKey",
                table: "Conversations");
        }
    }
}
