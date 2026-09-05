using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Platform.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddPublicId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PublicId",
                table: "Users",
                type: "uniqueidentifier",
                nullable: false,
                defaultValueSql: "NEWSEQUENTIALID()");

            migrationBuilder.AddColumn<Guid>(
                name: "PublicId",
                table: "Messages",
                type: "uniqueidentifier",
                nullable: false,
                defaultValueSql: "NEWSEQUENTIALID()");

            migrationBuilder.AddColumn<Guid>(
                name: "PublicId",
                table: "Friend",
                type: "uniqueidentifier",
                nullable: false,
                defaultValueSql: "NEWSEQUENTIALID()");

            migrationBuilder.AddColumn<Guid>(
                name: "PublicId",
                table: "EventsUsersInterest",
                type: "uniqueidentifier",
                nullable: false,
                defaultValueSql: "NEWSEQUENTIALID()");

            migrationBuilder.AddColumn<Guid>(
                name: "PublicId",
                table: "Events",
                type: "uniqueidentifier",
                nullable: false,
                defaultValueSql: "NEWSEQUENTIALID()");

            migrationBuilder.AddColumn<Guid>(
                name: "PublicId",
                table: "Banned",
                type: "uniqueidentifier",
                nullable: false,
                defaultValueSql: "NEWSEQUENTIALID()");

            migrationBuilder.CreateIndex(
                name: "IX_Users_PublicId",
                table: "Users",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Messages_PublicId",
                table: "Messages",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Friend_PublicId",
                table: "Friend",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventsUsersInterest_PublicId",
                table: "EventsUsersInterest",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Events_PublicId",
                table: "Events",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Banned_PublicId",
                table: "Banned",
                column: "PublicId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_PublicId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Messages_PublicId",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_Friend_PublicId",
                table: "Friend");

            migrationBuilder.DropIndex(
                name: "IX_EventsUsersInterest_PublicId",
                table: "EventsUsersInterest");

            migrationBuilder.DropIndex(
                name: "IX_Events_PublicId",
                table: "Events");

            migrationBuilder.DropIndex(
                name: "IX_Banned_PublicId",
                table: "Banned");

            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "Friend");

            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "EventsUsersInterest");

            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "Banned");
        }
    }
}
