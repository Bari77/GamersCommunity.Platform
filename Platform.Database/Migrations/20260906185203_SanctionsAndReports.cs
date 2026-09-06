using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Platform.Database.Migrations
{
    /// <inheritdoc />
    public partial class SanctionsAndReports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Banned_IdUserBan",
                table: "Banned");

            migrationBuilder.AlterColumn<DateTime>(
                name: "EndDate",
                table: "Banned",
                type: "datetime",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime");

            migrationBuilder.AddColumn<string>(
                name: "Kind",
                table: "Banned",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "RevokedAt",
                table: "Banned",
                type: "datetime",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Reports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PublicId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    CreationDate = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    ModificationDate = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    IdReporter = table.Column<int>(type: "int", nullable: false),
                    IdTarget = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    LinkUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reports_Reporter",
                        column: x => x.IdReporter,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Reports_Target",
                        column: x => x.IdTarget,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Banned_IdUserBan_Kind_RevokedAt",
                table: "Banned",
                columns: new[] { "IdUserBan", "Kind", "RevokedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Reports_IdReporter",
                table: "Reports",
                column: "IdReporter");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_IdTarget",
                table: "Reports",
                column: "IdTarget");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_PublicId",
                table: "Reports",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reports_Status",
                table: "Reports",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_Banned_IdUserBan_Kind_RevokedAt",
                table: "Banned");

            migrationBuilder.DropColumn(
                name: "Kind",
                table: "Banned");

            migrationBuilder.DropColumn(
                name: "RevokedAt",
                table: "Banned");

            migrationBuilder.AlterColumn<DateTime>(
                name: "EndDate",
                table: "Banned",
                type: "datetime",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Banned_IdUserBan",
                table: "Banned",
                column: "IdUserBan");
        }
    }
}
