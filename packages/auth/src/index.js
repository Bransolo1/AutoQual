"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canAccessProject = canAccessProject;
exports.canAccessClientPortal = canAccessClientPortal;
function canAccessProject(role) {
    return role !== "client";
}
function canAccessClientPortal(role) {
    return role === "client" || role === "admin";
}
