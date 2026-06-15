const TableManager = {
    table: null,

    get() {
        return this.table;
    },

    set(table) {
        this.table = table;
    },

    has() {
        return this.table !== null;
    },

    clear() {
        if (this.table && this.table.destroy) {
            this.table.destroy();
        }
        this.table = null;
    }
};

export default TableManager;
