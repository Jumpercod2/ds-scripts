(function(win, $) {
    'use strict';

    class HotkeyMapMarker {
        constructor(win, $) {
            this.win = win;
            this.$ = $;
            this.world = win.game_data.world;
            this.STORAGE_KEY = `hotkey_textbox_markers_v11_${this.world}`;
            this.markers = {};
            this.kordPattern = /\((\d{3}\|\d{3})\)/;
        }

        async init() {
            console.log("Karten-Skript V11.1 (Extern): Initialisiere im korrekten Kontext...");
            this.injectStyles();
            this.markers = await this.loadMarkersFromStorage();
            this.installMapHook();
            this.setupKeyListener();
            this.win.TWMap.reload();
            console.log("Karten-Skript V11.1 (Extern): System aktiv. Wähle ein Dorf und drücke 'n'.");
        }

        async loadMarkersFromStorage() {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        }

        async saveMarkersToStorage() {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.markers));
        }

        injectStyles() {
            this.$('head').append(`
                <style type="text/css">
                    .hotkey-text-marker {
                        position: absolute; z-index: 99;
                        background: rgba(10, 10, 10, 0.9); border: 2px solid red;
                        color: white; padding: 4px 8px; border-radius: 4px;
                        font: bold 12px Verdana, sans-serif; white-space: nowrap;
                        pointer-events: none; transform: translateX(-50%) translateY(-38px);
                        text-shadow: 1px 1px 2px black;
                    }
                    #marker-input-container {
                        padding: 5px; border-top: 1px solid #c19649; margin-top: 5px;
                    }
                    #marker-input-field { width: 95%; margin-bottom: 5px; }
                </style>
            `);
        }

        installMapHook() {
            this.win.TWMap.mapHandler.originalSpawnSector = this.win.TWMap.mapHandler.spawnSector;
            this.win.TWMap.mapHandler.spawnSector = (sector, a) => {
                this.win.TWMap.mapHandler.originalSpawnSector(sector, a);
                this.drawAllMarkers();
            };
        }

        drawAllMarkers() {
            this.$('.hotkey-text-marker').remove();
            for (const villageId in this.markers) {
                const village = this.win.TWMap.villages[villageId];
                if (village && village.display.visible) {
                    const villageElement = this.$(`#map_village_${villageId}`);
                    if (villageElement.length > 0) {
                        const style = villageElement.get(0).style;
                        this.$('<div>').addClass('hotkey-text-marker').text(this.markers[villageId])
                            .css({ top: style.top, left: style.left })
                            .insertBefore(villageElement);
                    }
                }
            }
        }

        showInputBox(village) {
            this.$('#marker-input-container').remove();
            const currentText = this.markers[village.id] || '';
            const inputBoxHtml = `<div id="marker-input-container" data-village-id="${village.id}"><input id="marker-input-field" type="text" value="${currentText}" placeholder="Notiz..."><button id="marker-save-btn" class="btn">Speichern</button></div>`;
            this.$('#map_popup #info_content').append(inputBoxHtml);
            this.$('#marker-input-field').focus().select();
        }

        setupKeyListener() {
            this.$(this.win.document).on('keypress', (e) => {
                if (e.target.tagName.toLowerCase().match(/input|textarea/)) return;
                if (String.fromCharCode(e.which).toLowerCase() === 'n') {
                    e.preventDefault();
                    const village = this.getVillageFromTooltip();
                    if (village) { this.showInputBox(village); }
                }
            });

            this.$('body').on('click', '#marker-save-btn', async (e) => {
                e.preventDefault();
                const container = this.$('#marker-input-container');
                const villageId = container.data('village-id');
                const text = this.$('#marker-input-field').val();
                if (text) { this.markers[villageId] = text; } else { delete this.markers[villageId]; }
                await this.saveMarkersToStorage();
                this.win.TWMap.reload();
                container.remove();
            });
        }
        
        getVillageFromTooltip() {
            if (this.$('#map_popup').is(':visible')) {
                const text = this.$("#info_content tr th").text();
                const match = text.match(this.kordPattern);
                if (match) {
                    const coords = match[1].replace('|', '_');
                    return this.win.TWMap.villages[this.win.TWMap.villageparts[coords]];
                }
            }
            return null;
        }
    }

    new HotkeyMapMarker(window, window.jQuery).init();

})(window, window.jQuery);
