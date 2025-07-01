(function(win, $) {
    'use strict';

    class FinalMapMarker {
        constructor(win, $) {
            this.win = win;
            this.$ = $;
            this.world = win.game_data.world;
            this.STORAGE_KEY = `final_map_markers_${this.world}`;
            this.markers = {};
        }

        async init() {
            console.log("Karten-Skript V3.0 (Extern): Initialisiere...");
            this.injectStyles();
            this.createUI();
            this.setupEventListeners();
            this.markers = await this.loadMarkers();
            this.win.$(this.win.document).on('map_loaded', () => this.drawAllMarkers());
            this.drawAllMarkers();
            console.log("Karten-Skript V3.0 (Extern): System läuft.");
        }

        async loadMarkers() {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        }

        async saveMarkers() {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.markers));
        }

        injectStyles() {
            this.$('head').append(`
                <style type="text/css">
                    .final-marker {
                        position: absolute;
                        z-index: 1001;
                        background: rgba(10, 10, 10, 0.85);
                        border: 1px solid #c19649;
                        color: white;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-family: 'Trebuchet MS', sans-serif;
                        white-space: nowrap;
                        pointer-events: none;
                        transform: translateX(-50%) translateY(-35px);
                    }
                    #marker-ui-container {
                        position: fixed; top: 120px; right: 5px; z-index: 10001;
                        background: #f4e4bc; border: 2px solid #7d510f;
                        padding: 10px; width: 220px;
                    }
                </style>
            `);
        }

        createUI() {
            if (this.$('#marker-ui-container').length > 0) return;
            const ui = this.$(`<div id="marker-ui-container"><h4>Karten-Markierung</h4><label for="coords-input">Koordinaten:</label><div style="display:flex;"><input type="text" id="coords-input" placeholder="Dorf anklicken..." style="flex-grow:1;"><button id="goto-coord-btn" class="btn" style="margin-left:5px;">Go</button></div><label for="text-input" style="margin-top:5px;display:block;">Notiz:</label><input type="text" id="text-input" placeholder="z.B. Off-Dorf"><button id="save-marker-btn" class="btn" style="width:100%;margin-top:10px;">Speichern</button><p style="font-size:9px;text-align:center;margin-top:5px;">Zum Löschen, Notizfeld leer lassen.</p></div>`);
            this.$('body').append(ui);
        }
        
        drawAllMarkers() {
            this.$('.final-marker').remove();
            for (const coords in this.markers) {
                const text = this.markers[coords];
                if (!text) continue;
                const [x, y] = coords.split('|').map(Number);
                const pixelPos = this.win.TWMap.map.coordToPixel(x, y);
                if (this.win.TWMap.map.isOnScreen(pixelPos.x, pixelPos.y)) {
                    this.$('<div>').addClass('final-marker').text(text)
                        .css({ top: pixelPos.top, left: pixelPos.left + (this.win.TWMap.tileSize[0] / 2) })
                        .appendTo('#map');
                }
            }
        }

        setupEventListeners() {
            const $body = this.$('body');
            $body.on('click', '#save-marker-btn', async (e) => {
                e.preventDefault();
                const coords = this.$('#coords-input').val();
                const text = this.$('#text-input').val();
                if (!coords || !coords.match(/^\d{1,3}\|\d{1,3}$/)) { alert("Ungültige Koordinaten."); return; }
                if (text) {
                    this.markers[coords] = text;
                } else {
                    delete this.markers[coords];
                }
                await this.saveMarkers();
                this.drawAllMarkers();
                this.$('#text-input').val('');
            });

            $body.on('click', '#goto-coord-btn', (e) => {
                e.preventDefault();
                const coords = this.$('#coords-input').val().split('|');
                if (coords.length === 2) this.win.TWMap.focus(parseInt(coords[0]), parseInt(coords[1]));
            });

            this.$('#map').on('click', 'div[id^="map_village_"]', (e) => {
                e.preventDefault(); e.stopPropagation();
                const villageId = e.currentTarget.id.replace('map_village_', '');
                const villageData = this.win.TWMap.villages[villageId];
                if (villageData) {
                    const coords = `${villageData.x}|${villageData.y}`;
                    this.$('#coords-input').val(coords);
                    this.$('#text-input').val(this.markers[coords] || '').focus();
                }
            });
        }
    }

    // Skript starten
    const MapMarkerInstance = new MapMarker(window, window.jQuery);
    MapMarkerInstance.init();

})(unsafeWindow, unsafeWindow.jQuery);
