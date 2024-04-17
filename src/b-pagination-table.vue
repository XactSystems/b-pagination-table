<template>
    <b-overlay :show="showLoading" rounded="sm" variant="transparent" blur="1px">
        <b-row v-if="pageLength || search">
            <b-col cols="12" :md="pageLengthCols">
                <b-row>
                    <slot name="header-left"></slot>
                    <b-col>
                        <b-form-group v-if="pageLength" label="Page length:" label-cols="5" class="mb-1">
                            <b-select size="sm" v-model.number="itemsPerPage" :options="pageLengthOptions" />
                        </b-form-group>
                    </b-col>
                </b-row> 
            </b-col>
            <b-col>
                <slot name="header"></slot>
            </b-col>
            <b-col cols="12" :md="searchCols">
                <b-row>
                    <b-col>
                        <slot name="search" :search-debounce="searchDebounce">
                            <b-form-group v-if="search && filterFunction === null" label="Search:" label-cols="3" class="mb-1">
                                <b-input size="sm" v-model="rawSearchText" :debounce="searchDebounce" />
                            </b-form-group>
                        </slot>
                    </b-col>
                    <slot name="header-right"></slot>
                </b-row>
            </b-col>
        </b-row>
        <b-row>
            <b-col>
                <b-table ref="table" v-bind="$attrs" :items="tableItemsOrFunc" :id="tableId"
                    :api-url="dataUrl" :per-page="itemsPerPage" :current-page="tableCurrentPage"
                    v-model:sort-by="tableSortBy" v-model:sort-desc="tableSortDesc"
                    :filter="tableFilter" :filter-function="filterFunction"
                    @filtered="onTableFilter" @sort-changed="onTableSortChanged" @row-selected="onRowSelected"
                    :aria-label="ariaLabel">
                    <template v-for="(index, name) in $slots" v-slot:[name]="data">
                        <slot :name="name" v-bind="data"></slot>
                    </template>
                </b-table>
            </b-col>
        </b-row>
        <b-row v-if="pagination != false" class="mt-1">
            <b-col cols="6" class="my-auto">
                <span v-if="rowCount != filteredCount" class=" float-left">Showing {{firstPageRow }} to {{ lastPageRow }} of {{ filteredCount }} filtered entries from {{ rowCount }}</span>
                <span v-else class=" float-left">Showing {{firstPageRow }} to {{ lastPageRow }} of {{ rowCount }} entries</span>
            </b-col>
            <b-col cols="6" class="mt-0">
                <div class="float-right">
                    <b-pagination v-if="showPagination" ref="pagination" v-model="currentPage" :total-rows="filteredCount" :per-page="itemsPerPage"
                        :limit="limit" :align="align" :pills="pills" :hide-goto-end-buttons="hideGotoEndButtons"
                        :label-first-page="labelFirstPage" :first-text="firstText" :first-number="firstNumber" :first-class="firstClass"
                        :label-prev-page="labelPrevPage" :prev-text="prevText" :prev-class="prevClass"
                        :label-next-page="labelNextPage" :next-text="nextText" :next-class="nextClass"
                        :label-last-page="labelLastPage" :last-text="lastText" :last-number="lastNumber" :last-class="lastClass"
                        :label-page="labelPage" :page-class="pageClass"
                        :hide-ellipsis="hideEllipsis" :ellipsis-text="ellipsisText" :ellipsis-class="ellipsisClass"
                        :size="paginationSize" :aria-label="paginationAriaLabel" :aria-controls="tableId"
                        class="mx-1">
                        <template v-for="(index, name) in $slots" v-slot:[name]="data">
                            <slot :name="name" v-bind="data"></slot>
                        </template>
                    </b-pagination>
                </div>
            </b-col>
        </b-row>
    </b-overlay>
</template>

<script>

import axios from 'axios';

const EVENT_UPDATE_PER_PAGE = 'update:per-page';
const EVENT_UPDATE_REFRESH = 'update:refresh';
const UPDATE_ITEMS = 'update:items';
const EVENT_ROW_SELECTED = 'row-selected';
const EVENT_FILTERED = 'filtered';
const EVENT_SORT_CHANGED = 'sort-changed';

export default {

    inheritAttrs: false,
    
    props: {
        dataUrl: String,
        items: { type: Array, required: false, default: () => [] },
        perPage: { type: [String, Number], required: false, default: 20 },
        pagination: {
            type: [Boolean, String], required: false, default: true,
            validator: (value) => ['always', true, false].indexOf(value) !== -1
        },
        pageLength: { type: Boolean, required: false, default: false },
        pageLengthOptions: { type: Array, required: false, default: () => [ 10, 20, 50, 75, 100 ] },
        pageLengthCols: { type: [String, Number], required: false, default: 5 },
        search: { type: Boolean, required: false, default: false },
        searchMinLength: { type: [String, Number], required: false, default: 0 },
        searchDebounce: { type: [String, Number], required: false, default: 150 },
        searchCols: { type: [String, Number], required: false, default: 5 },
        filter: { type: String, required: false, default: null },
        filterFunction: { type: Function, required: false, default: null },
        sortBy: { type: String, required: false, default: '' },
        sortDesc: { type: Boolean, required: false, default: false },
        ssp: { type: Boolean, required: false, default: false },
        state: { type: Boolean, required: false, default: false },
        ariaLabel: { type: String, required: false, default: 'Pagination Table' },
        id: { type: String, required: false },
        // Pagination props
        limit: [String, Number],
        align: { type: String, required: false, default: 'left' },
        pills: { type: Boolean, required: false, default: false },
        hideGotoEndButtons: { type: Boolean, required: false, default: false },
        labelFirstPage: { type: String, required: false, default: 'Go to first page' },
        firstText: { type: String, required: false, default: '«' },
        firstNumber: { type: Boolean, required: false, default: false },
        firstClass: [String, Array, Object],
        labelPrevPage: { type: String, required: false, default: 'Go to previous page' },
        prevText: { type: String, required: false, default: '‹' },
        prevClass: [String, Array, Object],
        labelNextPage: { type: String, required: false, default: 'Go to next page' },
        nextText: { type: String, required: false, default: '›' },
        nextClass: [String, Array, Object],
        labelLastPage: { type: String, required: false, default: 'Go to last page' },
        lastText: { type: String, required: false, default: '»' },
        lastNumber: { type: Boolean, required: false, default: false },
        lastClass: [String, Array, Object],
        labelPage: { type: String, required: false, default: 'Go to page' },
        pageClass: [String, Array, Object],
        hideEllipsis: { type: Boolean, required: false, default: false },
        ellipsisText: { type: String, required: false, default: '…' },
        ellipsisClass: [String, Array, Object],
        paginationSize: String,
        paginationAriaLabel: { type: String, required: false, default: 'Pagination' },
        // Table refresh when using the dataUrl with or without SSP
        refresh: { type: Boolean, required: false, default: false },
        // Events consumed in this component that we need to bubble upwards.
        rowSelected: { type: Function, required: false, default: null },

    },

    data() {
        return {
            tableData: [],
            filteredData: [],
            currentPage: 1,
            itemsPerPage: 20,
            rowCount: 0,
            filteredCount: 0,
            showLoading: false,
            rawSearchText: null,
            searchText: null,
            tableSortBy: '',
            tableSortDesc: false,
            localRefresh: false,
            pageSelectedIndexes: new Map(),
        }
    },

    computed: {
        firstPageRow() { return (this.pagination && this.filteredCount > 0 ? ((this.currentPage - 1) * this.itemsPerPage) + 1 : 0); },
        lastPageRow() {
            return (this.pagination && this.filteredCount > 0 ? (
                this.firstPageRow + (this.itemsPerPage < this.filteredCount ? (
                    this.filteredCount - this.firstPageRow > this.itemsPerPage ? this.itemsPerPage : this.filteredCount - this.firstPageRow + 1
                 ) : this.filteredCount) - 1
            ) : 0);
        },
        pageCount() { return (this.pagination ? Math.ceil(this.filteredCount / this.itemsPerPage) : 1); },
        tableCurrentPage() { return (this.ssp ? 1 : this.currentPage); },
        stateName() { return `b-pagination-table_${this._uid }_${window.location.pathname}`; },
        tableId() { return this.id || `b-pagination-table-${this._uid }`; },
        showPagination() { return (this.pagination == 'always' || (this.pagination == true && this.pageCount > 1)); },
        tableFilter() { return this.filter || this.searchText; },
        filteredTableData() { return (this.filteredData.length > 0 ? this.filteredData : this.tableData); },
        tableItemsOrFunc() {
            // If using SSP we must use the items provider function
            if (this.ssp) {
                return this.fetchFilteredItems;
            }
            return this.tableData;
        },
    },

    watch: {
        items: {
            handler(items) {
                this.tableData = items;
                this.rowCount = this.filteredCount = this.tableData.length;
                this.pageSelectedIndexes.clear();
            },
            immediate: true
        },

        perPage: {
            handler(perPage) {
                this.itemsPerPage = (this.pagination ? Number(perPage) : 0);
            },
            immediate: true
        },

        sortBy: {
            handler(newValue) {
                this.tableSortBy = newValue;
            },
            immediate: true
        },

        sortDesc: {
            handler(newValue) {
                this.tableSortDesc = newValue;
            },
            immediate: true
        },

        dataUrl: {
            handler() {
                this.refreshTableData();
            },
            immediate: true
        },

        rawSearchText(newValue) {
            let len = String(newValue).length;
            if (len == 0 || len >= this.searchMinLength) {
                this.searchText = newValue;
            }
            this.saveState();
        },

        filteredCount() {
            this.setFilteredPagePosition();
        },

        itemsPerPage(itemsPerPage) {
            this.$emit(EVENT_UPDATE_PER_PAGE, itemsPerPage);
            this.setFilteredPagePosition();
        },

        currentPage() {
            if (this.ssp) {
                this.refreshTableData();
            }
            this.saveState();
            this.restoreSelectedRows();
        },

        refresh(refresh) {
            this.localRefresh = refresh;
        },

        localRefresh(refresh) {
            if (refresh) {
                this.refreshTableData();
                this.$nextTick(() => {
                    this.refresh = false;
                });
            }
            this.$emit(EVENT_UPDATE_REFRESH, this.localRefresh);
        },
    },

    mounted() {
        if (this.state && localStorage.getItem(this.stateName)) {
            let tableState = JSON.parse(localStorage.getItem(this.stateName));
            if (tableState) {
                this.tableSortBy = tableState.tableSortBy || this.tableSortBy;
                this.tableSortDesc = tableState.tableSortDesc || this.tableSortDesc;
                this.rawSearchText = tableState.rawSearchText || this.rawSearchText;
                this.itemsPerPage = (this.pagination ? (tableState.itemsPerPage || this.itemsPerPage) : 0);
                this.filteredCount = tableState.filteredCount || this.filteredCount;
                this.$nextTick(() => {
                    this.currentPage = tableState.currentPage || this.currentPage;
                    this.setFilteredPagePosition();
                });
            }
        }
    },

    methods: {
        onTableSortChanged(context) {
            this.filteredData = this.$refs.table.sortedItems; // This is not a defined public property but really should be included in the event context
            this.saveState();
            this.clearSelectedItems();
            this.$emit(EVENT_SORT_CHANGED, context); // TODO: There may be a bug as this event should get emitted. See https://vuejs.org/guide/components/attrs#v-on-listener-inheritance
        },

        saveState() {
            if (this.state) {
                this.$nextTick(() => {
                    let tableState = {
                        tableSortBy: this.tableSortBy,
                        tableSortDesc: this.tableSortDesc,
                        rawSearchText: this.rawSearchText,
                        itemsPerPage: this.itemsPerPage,
                        filteredCount: this.filteredCount,
                        currentPage: this.currentPage,
                    };
                    localStorage.setItem(this.stateName, JSON.stringify(tableState));
                });
            }
        },

        // Fetch the unfiltered table data from the server or call refresh
        refreshTableData() {
            if (!this.ssp && this.dataUrl) {
                const context = {
                    apiUrl: this.dataUrl,
                    filter: null,
                    sortBy: null,
                    perPage: null,
                };

                this.fetchFilteredItems(context);
            } else if (this.$refs.table) {
                this.$refs.table.refresh();
            }
        },

        setFilteredPagePosition() {
            // Reset the page number if it's now outside of the possible range
            if (this.pagination && Math.ceil(this.filteredCount / this.itemsPerPage) < this.currentPage) {
                this.currentPage = (this.filteredCount > 0 ? Math.ceil(this.filteredCount / this.itemsPerPage) : 1);
            }
            this.saveState();
        },

        /**
         * Fetch the filtered data from the server. This uses
         * Server Side Processing to filter and sort the data.
         * See 'Using items provider functions'
         * https://bootstrap-vue.org/docs/components/table#using-items-provider-functions
         */
        async fetchFilteredItems(context) {
            if (context.apiUrl) {
                try {
                    let url = this.getPaginationUrl(context);
                    this.showLoading = true;
                    let result = await axios.get(url);
                    this.tableData =  (Array.isArray(result.data.data) ? result.data.data: []);
                    if (result.data.totalCount) {
                        this.rowCount = result.data.totalCount;
                        this.filteredCount = result.data.filteredCount;
                    } else {
                        this.rowCount = this.filteredCount = this.tableData.length;
                    }

                    this.$emit(UPDATE_ITEMS, this.tableData);
                }
                catch (error) {
                    this.tableData = [];
                    this.displayError(`An error occurred fetching the table data from ${context.apiUrl}: ${error.message}`);
                }
                finally {
                    this.pageSelectedIndexes.clear();
                    this.showLoading = false;
                }
            }
            return this.tableData;
        },

        getPaginationUrl(context) {
            // If we are not using server-side-pagination return the original, use the b-table filter
            if (!this.ssp) {
                return context.apiUrl;
            }
            let url = new URL(context.apiUrl, window.location.href);
            let query = url.searchParams;
            // Global search filter
            if (context.filter) {
                query.set('filter', context.filter);
            }
            // Sorting
            if (context.sortBy) {
                query.set('orderBy', (context.sortDesc ? '-' : '' ) + context.sortBy);
            }
            // Pagination
            query.set('pageStart', this.firstPageRow > 0 ? this.firstPageRow - 1 : 0);
            query.set('pageLength', context.perPage);
            return url.toString();
        },

        clearSelectedItems() {
            this.pageSelectedIndexes.clear();
            this.$refs.table.clearSelected();
        },

        onTableFilter(items, count) {
            this.filteredData = items;
            this.filteredCount = (this.ssp ? this.filteredCount : count);
            this.clearSelectedItems();
            this.$emit(EVENT_FILTERED, items, count); // TODO: There may be a bug as this event should get emitted. See https://vuejs.org/guide/components/attrs#v-on-listener-inheritance
        },

        onRowSelected(rows) {
            if (!this.ssp) {
                const selectedIndexes = [];
                rows.forEach( function find(row) {
                    // Save ths index of the item in the data list, not the current page row index
                    selectedIndexes.push(this.filteredTableData.findIndex((item) => item === row));
                }, this);
                this.pageSelectedIndexes.set(this.currentPage, selectedIndexes);
            }
            this.$emit(EVENT_ROW_SELECTED, rows); // TODO: There may be a bug as this event should get emitted. See https://vuejs.org/guide/components/attrs#v-on-listener-inheritance
        },

        restoreSelectedRows() {
            if (this.pageSelectedIndexes.has(this.currentPage)) {
                const selectedIndexes = this.pageSelectedIndexes.get(this.currentPage);
                this.$nextTick(() => {
                    selectedIndexes.forEach( function set(index) {
                        // Offset the index to the current visible rows
                        this.$refs.table.selectRow(index - (this.firstPageRow - 1));
                    }, this);
                });
            }
        },

        displayError(message) {
            this.$bvModal.msgBoxOk(message, { title: 'Pagination Table' });
        },

        /**
         * Proxy methods for the table component
         */
        selectRow(index) {
            this.$refs.table.selectRow(index);
        },

        unselectRow(index) {
            this.$refs.table.unselectRow(index);
        },

        selectAllRows() {
            this.$refs.table.selectAllRows();
        },

        clearSelected() {
            this.$refs.table.clearSelected();
        },

        isRowSelected(index) {
            this.$refs.table.isRowSelected(index);
        },

        getAllSelectedRows() {
            const items = [];
            this.pageSelectedIndexes.forEach( function page(indexes) {
                indexes.forEach( function data(index) {
                    items.push(this.filteredTableData[index]);
                }, this);
            }, this);

            return items;
        },
    }
}
</script>
