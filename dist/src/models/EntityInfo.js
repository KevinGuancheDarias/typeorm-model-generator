"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EntityInfo {
    relationImports() {
        var imports = [];
        this.Columns.forEach(column => {
            column.relations.forEach(relation => {
                if (this.EntityName != relation.relatedTable)
                    imports.push(relation.relatedTable);
            });
        });
        this.UniqueImports = imports.filter(function (elem, index, self) {
            return index == self.indexOf(elem);
        });
    }
}
exports.EntityInfo = EntityInfo;
//# sourceMappingURL=EntityInfo.js.map