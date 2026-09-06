using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Platform.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddMessageKind : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Kind",
                table: "Messages",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "text");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Kind",
                table: "Messages");
        }
    }
}
