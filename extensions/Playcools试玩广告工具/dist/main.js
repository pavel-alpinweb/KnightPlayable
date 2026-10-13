"use strict";
const PACKAGE_NAME = 'playcools';
module.exports = {
    load() {
        console.log('[Playcools] 免费 Cocos 工具插件已加载');
    },
    unload() {
        console.log('[Playcools] 免费 Cocos 工具插件已卸载');
    },
    methods: {
        openMainPanel() {
            return Editor.Panel.open(PACKAGE_NAME);
        },
    },
};
