"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ColumnInfo {
    constructor() {
        this.tsName = "";
        this.sqlName = "";
        this.default = null;
        this.is_nullable = false;
        this.is_unique = false;
        this.lenght = null;
        this.width = null;
        this.isPrimary = false;
        this.is_generated = false;
        this.is_array = false;
        this.numericPrecision = null;
        this.numericScale = null;
        this.enumOptions = null;
        this.relations = [];
    }
}
exports.ColumnInfo = ColumnInfo;
//# sourceMappingURL=ColumnInfo.js.map