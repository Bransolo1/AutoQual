"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSignedUrl = buildSignedUrl;
function buildSignedUrl(storageKey) {
    return `https://storage.local/${encodeURIComponent(storageKey)}`;
}
