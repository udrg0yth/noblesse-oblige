import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ContextMenuAttachDirective } from './contextMenu.attach.directive';
import { ContextMenuComponent } from './contextMenu.component';
import { ContextMenuItemDirective } from './contextMenu.item.directive';
import { ContextMenuService } from './contextMenu.service';
import { CONTEXT_MENU_OPTIONS } from './contextMenu.tokens';
import { ContextMenuContentComponent } from './contextMenuContent.component';
var ContextMenuModule = (function () {
    function ContextMenuModule() {
    }
    ContextMenuModule.forRoot = function (options) {
        return {
            ngModule: ContextMenuModule,
            providers: [
                ContextMenuService,
                {
                    provide: CONTEXT_MENU_OPTIONS,
                    useValue: options,
                },
            ],
        };
    };
    ContextMenuModule.decorators = [
        { type: NgModule, args: [{
                    declarations: [
                        ContextMenuAttachDirective,
                        ContextMenuComponent,
                        ContextMenuContentComponent,
                        ContextMenuItemDirective,
                    ],
                    entryComponents: [
                        ContextMenuContentComponent,
                    ],
                    exports: [
                        ContextMenuAttachDirective,
                        ContextMenuComponent,
                        ContextMenuItemDirective,
                    ],
                    imports: [
                        CommonModule,
                        OverlayModule,
                    ],
                },] },
    ];
    /** @nocollapse */
    ContextMenuModule.ctorParameters = function () { return []; };
    return ContextMenuModule;
}());
export { ContextMenuModule };
//# sourceMappingURL=ngx-contextmenu.js.map