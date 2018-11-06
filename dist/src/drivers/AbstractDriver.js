"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const EntityInfo_1 = require("../models/EntityInfo");
const TomgUtils = require("../Utils");
const RelationInfo_1 = require("../models/RelationInfo");
const ColumnInfo_1 = require("../models/ColumnInfo");
class AbstractDriver {
    constructor() {
        this.ColumnTypesWithWidth = [
            "tinyint",
            "smallint",
            "mediumint",
            "int",
            "bigint"
        ];
        this.ColumnTypesWithPrecision = [
            "float",
            "double",
            "dec",
            "decimal",
            "numeric",
            "real",
            "double precision",
            "number",
            "datetime",
            "datetime2",
            "datetimeoffset",
            "time",
            "time with time zone",
            "time without time zone",
            "timestamp",
            "timestamp without time zone",
            "timestamp with time zone",
            "timestamp with local time zone"
        ];
        this.ColumnTypesWithLength = [
            "character varying",
            "varying character",
            "nvarchar",
            "character",
            "native character",
            "varchar",
            "char",
            "nchar",
            "varchar2",
            "nvarchar2",
            "raw",
            "binary",
            "varbinary"
        ];
    }
    changeColumnNames(dbModel) {
        dbModel.entities.forEach(entity => {
            entity.Columns.forEach(column => {
                let newName = this.namingStrategy.columnName(column.tsName);
                entity.Indexes.forEach(index => {
                    index.columns
                        .filter(column2 => {
                        return column2.name == column.tsName;
                    })
                        .forEach(column2 => {
                        column2.name = newName;
                    });
                });
                dbModel.entities.forEach(entity2 => {
                    entity2.Columns.forEach(column2 => {
                        column2.relations
                            .filter(relation => {
                            return (relation.relatedTable ==
                                entity.EntityName &&
                                relation.relatedColumn == column.tsName);
                        })
                            .map(v => {
                            v.relatedColumn = newName;
                        });
                        column2.relations
                            .filter(relation => {
                            return (relation.relatedTable ==
                                entity.EntityName &&
                                relation.ownerColumn == column.tsName);
                        })
                            .map(v => {
                            v.ownerColumn = newName;
                        });
                    });
                });
                column.tsName = newName;
            });
        });
    }
    changeEntityNames(dbModel) {
        dbModel.entities.forEach(entity => {
            let newName = this.namingStrategy.entityName(entity.EntityName);
            dbModel.entities.forEach(entity2 => {
                entity2.Columns.forEach(column => {
                    column.relations.forEach(relation => {
                        if (relation.ownerTable == entity.EntityName)
                            relation.ownerTable = newName;
                        if (relation.relatedTable == entity.EntityName)
                            relation.relatedTable = newName;
                    });
                });
            });
            entity.EntityName = newName;
        });
    }
    changeRelationNames(dbModel) {
        dbModel.entities.forEach(entity => {
            entity.Columns.forEach(column => {
                column.relations.forEach(relation => {
                    if (true || !relation.isOwner) {
                        let newName = this.namingStrategy.relationName(column.tsName, relation, dbModel);
                        dbModel.entities.forEach(entity2 => {
                            entity2.Columns.forEach(column2 => {
                                column2.relations.forEach(relation2 => {
                                    if (relation2.relatedTable ==
                                        entity.EntityName &&
                                        relation2.ownerColumn == column.tsName) {
                                        relation2.ownerColumn = newName;
                                    }
                                    if (relation2.relatedTable ==
                                        entity.EntityName &&
                                        relation2.relatedColumn == column.tsName) {
                                        relation2.relatedColumn = newName;
                                    }
                                    if (relation.isOwner) {
                                        entity.Indexes.forEach(ind => {
                                            ind.columns.forEach(col => {
                                                if (col.name == column.tsName) {
                                                    col.name = newName;
                                                }
                                            });
                                        });
                                    }
                                });
                            });
                        });
                        column.tsName = newName;
                    }
                });
            });
        });
    }
    FindManyToManyRelations(dbModel) {
        let manyToManyEntities = dbModel.entities.filter(entity => {
            return (entity.Columns.filter(column => {
                return (column.relations.length == 1 &&
                    !column.relations[0].isOneToMany &&
                    column.relations[0].isOwner);
            }).length == entity.Columns.length);
        });
        manyToManyEntities.map(entity => {
            let relations = [];
            relations = entity.Columns.reduce((prev, curr) => {
                return prev.concat(curr.relations);
            }, relations);
            let namesOfRelatedTables = relations
                .map(v => v.relatedTable)
                .filter((v, i, s) => s.indexOf(v) == i);
            if (namesOfRelatedTables.length == 2) {
                let relatedTable1 = dbModel.entities.filter(v => v.EntityName == namesOfRelatedTables[0])[0];
                relatedTable1.Columns = relatedTable1.Columns.filter(v => !v.tsName
                    .toLowerCase()
                    .startsWith(entity.EntityName.toLowerCase()));
                let relatedTable2 = dbModel.entities.filter(v => v.EntityName == namesOfRelatedTables[1])[0];
                relatedTable2.Columns = relatedTable2.Columns.filter(v => !v.tsName
                    .toLowerCase()
                    .startsWith(entity.EntityName.toLowerCase()));
                dbModel.entities = dbModel.entities.filter(ent => {
                    return ent.EntityName != entity.EntityName;
                });
                let column1 = new ColumnInfo_1.ColumnInfo();
                column1.tsName = namesOfRelatedTables[1];
                let col1Rel = new RelationInfo_1.RelationInfo();
                col1Rel.relatedTable = namesOfRelatedTables[1];
                col1Rel.relatedColumn = namesOfRelatedTables[1];
                col1Rel.relationType = "ManyToMany";
                col1Rel.isOwner = true;
                col1Rel.ownerColumn = namesOfRelatedTables[0];
                column1.relations.push(col1Rel);
                relatedTable1.Columns.push(column1);
                let column2 = new ColumnInfo_1.ColumnInfo();
                column2.tsName = namesOfRelatedTables[0];
                let col2Rel = new RelationInfo_1.RelationInfo();
                col2Rel.relatedTable = namesOfRelatedTables[0];
                col2Rel.relatedColumn = namesOfRelatedTables[1];
                col2Rel.relationType = "ManyToMany";
                col2Rel.isOwner = false;
                column2.relations.push(col2Rel);
                relatedTable2.Columns.push(column2);
            }
        });
    }
    GetDataFromServer(database, server, port, user, password, schema, ssl, namingStrategy, relationIds) {
        return __awaiter(this, void 0, void 0, function* () {
            this.generateRelationsIds = relationIds;
            let dbModel = {};
            this.namingStrategy = namingStrategy;
            yield this.ConnectToServer(database, server, port, user, password, ssl);
            let sqlEscapedSchema = "'" + schema.split(",").join("','") + "'";
            dbModel.entities = yield this.GetAllTables(sqlEscapedSchema);
            yield this.GetCoulmnsFromEntity(dbModel.entities, sqlEscapedSchema);
            yield this.GetIndexesFromEntity(dbModel.entities, sqlEscapedSchema);
            dbModel.entities = yield this.GetRelations(dbModel.entities, sqlEscapedSchema);
            yield this.DisconnectFromServer();
            this.FindManyToManyRelations(dbModel);
            this.FindPrimaryColumnsFromIndexes(dbModel);
            this.ApplyNamingStrategy(dbModel);
            return dbModel;
        });
    }
    ApplyNamingStrategy(dbModel) {
        this.changeRelationNames(dbModel);
        this.changeEntityNames(dbModel);
        this.changeColumnNames(dbModel);
    }
    GetAllTables(schema) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield this.GetAllTablesQuery(schema);
            let ret = [];
            response.forEach(val => {
                let ent = new EntityInfo_1.EntityInfo();
                ent.EntityName = val.TABLE_NAME;
                ent.Schema = val.TABLE_SCHEMA;
                ent.Columns = [];
                ent.Indexes = [];
                ret.push(ent);
            });
            return ret;
        });
    }
    GetRelationsFromRelationTempInfo(relationsTemp, entities) {
        relationsTemp.forEach(relationTmp => {
            let ownerEntity = entities.find(entitity => {
                return entitity.EntityName == relationTmp.ownerTable;
            });
            if (!ownerEntity) {
                TomgUtils.LogError(`Relation between tables ${relationTmp.ownerTable} and ${relationTmp.referencedTable} didn't found entity model ${relationTmp.ownerTable}.`);
                return;
            }
            let referencedEntity = entities.find(entitity => {
                return entitity.EntityName == relationTmp.referencedTable;
            });
            if (!referencedEntity) {
                TomgUtils.LogError(`Relation between tables ${relationTmp.ownerTable} and ${relationTmp.referencedTable} didn't found entity model ${relationTmp.referencedTable}.`);
                return;
            }
            for (let relationColumnIndex = 0; relationColumnIndex < relationTmp.ownerColumnsNames.length; relationColumnIndex++) {
                let ownerColumn = ownerEntity.Columns.find(column => {
                    return (column.tsName ==
                        relationTmp.ownerColumnsNames[relationColumnIndex]);
                });
                if (!ownerColumn) {
                    TomgUtils.LogError(`Relation between tables ${relationTmp.ownerTable} and ${relationTmp.referencedTable} didn't found entity column ${relationTmp.ownerTable}.${ownerColumn}.`);
                    return;
                }
                let relatedColumn = referencedEntity.Columns.find(column => {
                    return (column.tsName ==
                        relationTmp.referencedColumnsNames[relationColumnIndex]);
                });
                if (!relatedColumn) {
                    TomgUtils.LogError(`Relation between tables ${relationTmp.ownerTable} and ${relationTmp.referencedTable} didn't found entity column ${relationTmp.referencedTable}.${relatedColumn}.`);
                    return;
                }
                let isOneToMany;
                isOneToMany = false;
                let index = ownerEntity.Indexes.find(index => {
                    return (index.isUnique &&
                        index.columns.some(col => {
                            return col.name == ownerColumn.tsName;
                        }));
                });
                isOneToMany = !index;
                let ownerRelation = new RelationInfo_1.RelationInfo();
                ownerRelation.actionOnDelete = relationTmp.actionOnDelete;
                ownerRelation.actionOnUpdate = relationTmp.actionOnUpdate;
                ownerRelation.isOwner = true;
                ownerRelation.relatedColumn = relatedColumn.tsName.toLowerCase();
                ownerRelation.relatedTable = relationTmp.referencedTable;
                ownerRelation.ownerTable = relationTmp.ownerTable;
                ownerRelation.relationType = isOneToMany
                    ? "ManyToOne"
                    : "OneToOne";
                ownerRelation.relationIdField = this.generateRelationsIds;
                let columnName = ownerEntity.EntityName;
                if (referencedEntity.Columns.some(v => v.tsName == columnName)) {
                    columnName = columnName + "_";
                    for (let i = 2; i <= referencedEntity.Columns.length; i++) {
                        columnName =
                            columnName.substring(0, columnName.length - i.toString().length) + i.toString();
                        if (referencedEntity.Columns.every(v => v.tsName != columnName))
                            break;
                    }
                }
                ownerRelation.ownerColumn = columnName;
                ownerColumn.relations.push(ownerRelation);
                if (isOneToMany) {
                    let col = new ColumnInfo_1.ColumnInfo();
                    col.tsName = columnName;
                    let referencedRelation = new RelationInfo_1.RelationInfo();
                    col.relations.push(referencedRelation);
                    referencedRelation.actionOnDelete =
                        relationTmp.actionOnDelete;
                    referencedRelation.actionOnUpdate =
                        relationTmp.actionOnUpdate;
                    referencedRelation.isOwner = false;
                    referencedRelation.relatedColumn = ownerColumn.tsName;
                    referencedRelation.relatedTable = relationTmp.ownerTable;
                    referencedRelation.ownerTable = relationTmp.referencedTable;
                    referencedRelation.ownerColumn = relatedColumn.tsName;
                    referencedRelation.relationType = "OneToMany";
                    referencedEntity.Columns.push(col);
                }
                else {
                    let col = new ColumnInfo_1.ColumnInfo();
                    col.tsName = columnName;
                    let referencedRelation = new RelationInfo_1.RelationInfo();
                    col.relations.push(referencedRelation);
                    referencedRelation.actionOnDelete =
                        relationTmp.actionOnDelete;
                    referencedRelation.actionOnUpdate =
                        relationTmp.actionOnUpdate;
                    referencedRelation.isOwner = false;
                    referencedRelation.relatedColumn = ownerColumn.tsName;
                    referencedRelation.relatedTable = relationTmp.ownerTable;
                    referencedRelation.ownerTable = relationTmp.referencedTable;
                    referencedRelation.ownerColumn = relatedColumn.tsName;
                    referencedRelation.relationType = "OneToOne";
                    referencedEntity.Columns.push(col);
                }
            }
        });
        return entities;
    }
    FindPrimaryColumnsFromIndexes(dbModel) {
        dbModel.entities.forEach(entity => {
            let primaryIndex = entity.Indexes.find(v => v.isPrimaryKey);
            entity.Columns.forEach(col => {
                if (primaryIndex &&
                    primaryIndex.columns.some(cIndex => cIndex.name == col.tsName))
                    col.isPrimary = true;
            });
            if (!entity.Columns.some(v => {
                return v.isPrimary;
            })) {
                TomgUtils.LogError(`Table ${entity.EntityName} has no PK.`, false);
                return;
            }
        });
    }
}
exports.AbstractDriver = AbstractDriver;
//# sourceMappingURL=AbstractDriver.js.map