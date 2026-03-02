"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAuditEvent = buildAuditEvent;
function buildAuditEvent(input) {
    return {
        ...input,
        createdAt: new Date().toISOString()
    };
}
