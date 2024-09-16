"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CollectionEntityModule", {
    enumerable: true,
    get: function() {
        return CollectionEntityModule;
    }
});
const _common = require("@nestjs/common");
const _collectioncontroller = require("./collection.controller");
const _collectionservice = require("./collection.service");
const _userentity = require("../user/entity/user.entity");
const _pagitnateservice = require("../common/paginate/pagitnate.service");
const _collectionentity = require("./entity/collection.entity");
const _typeorm = require("@nestjs/typeorm");
const _nftentity = require("../nft/entity/nft.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let CollectionEntityModule = class CollectionEntityModule {
};
CollectionEntityModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _collectionentity.CollectionEntity,
                _userentity.User,
                _nftentity.NFT
            ])
        ],
        controllers: [
            _collectioncontroller.CollectionsController
        ],
        providers: [
            _collectionservice.CollectionsService,
            _pagitnateservice.PaginationService
        ]
    })
], CollectionEntityModule);

//# sourceMappingURL=collection.module.js.map