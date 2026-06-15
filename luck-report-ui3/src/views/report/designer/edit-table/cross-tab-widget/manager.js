const CrossTabWidgetManager = {
    widgets: {},

    get(key) {
        return this.widgets[key];
    },

    set(key, widget) {
        this.widgets[key] = widget;
    },

    has(key) {
        return key in this.widgets;
    },

    remove(key) {
        const widget = this.widgets[key];
        if (widget && widget.destroy) {
            widget.destroy();
        }
        delete this.widgets[key];
    },

    clear() {
        Object.keys(this.widgets).forEach(key => {
            const widget = this.widgets[key];
            if (widget && widget.destroy) {
                widget.destroy();
            }
        });
        this.widgets = {};
    }
};

export default CrossTabWidgetManager;
