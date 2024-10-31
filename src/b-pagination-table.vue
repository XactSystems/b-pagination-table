<template>
    <BOverlay :show="showLoading" rounded="sm" variant="transparent" blur="1px">
        <BRow v-if="pageLength || search">
            <BCol cols="12" :md="pageLengthCols">
                <BRow>
                    <slot name="header-left" />
                    <BCol>
                        <BFormGroup v-if="pageLength" label="Page length:" label-cols="5" class="mb-1">
                            <BFormSelect v-model.number="itemsPerPage" size="sm" :options="pageLengthOptions" />
                        </BFormGroup>
                    </BCol>
                </BRow>
            </BCol>
            <BCol>
                <slot name="header" />
            </BCol>
            <BCol cols="12" :md="searchCols">
                <BRow>
                    <BCol>
                        <slot name="search" :search-debounce="searchDebounce">
                            <BFormGroup v-if="search && filterFunction === null" label="Search:" label-cols="3" class="mb-1">
                                <BInput v-model="rawSearchText" size="sm" :debounce="searchDebounce" />
                            </BFormGroup>
                        </slot>
                    </BCol>
                    <slot name="header-right" />
                </BRow>
            </BCol>
        </BRow>
        <BRow>
            <BCol>
                <BTable
                    :id="tableId" ref="table"
                    v-model:sort-by="tableSortBy"
                    :provider="tableProvider"
                    :no-provider-filtering="!ssp"
                    :no-provider-paging="!ssp"
                    :no-provider-sorting="!ssp"
                    :per-page="itemsPerPage"
                    :current-page="tableCurrentPage"
                    :filter="tableFilter"
                    :filter-function="filterFunction"
                    :aria-label="ariaLabel"
                    v-bind="$attrs"
                    @filtered="onTableFilter"
                    @sorted="onTableSorted"
                    @row-selected="onRowSelected"
                >
                    <template v-for="(index, name) in $slots" #[name]="data">
                        <slot :name="name" v-bind="data" />
                    </template>
                </BTable>
            </BCol>
        </BRow>
        <BRow v-if="pagination != false" class="mt-1">
            <BCol cols="6" class="my-auto">
                <span v-if="rowCount != filteredCount" class=" float-start">
                    Showing {{ firstPageRow }} to {{ lastPageRow }} of {{ filteredCount }} filtered entries from {{ rowCount }}
                </span>
                <span v-else class=" float-start">
                    Showing {{ firstPageRow }} to {{ lastPageRow }} of {{ rowCount }} entries
                </span>
            </BCol>
            <BCol cols="6" class="mt-0">
                <div class="float-end">
                    <BPagination
                        v-if="showPagination" ref="pagination"
                        v-model="currentPage"
                        :total-rows="filteredCount"
                        :per-page="itemsPerPage" :limit="limit"
                        :align="align"
                        :pills="pills"
                        :hide-goto-end-buttons="hideGotoEndButtons"
                        :label-first-page="labelFirstPage"
                        :first-text="firstText"
                        :first-number="firstNumber"
                        :first-class="firstClass"
                        :label-prev-page="labelPrevPage"
                        :prev-text="prevText"
                        :prev-class="prevClass"
                        :label-next-page="labelNextPage"
                        :next-text="nextText"
                        :next-class="nextClass"
                        :label-last-page="labelLastPage"
                        :last-text="lastText"
                        :last-number="lastNumber"
                        :last-class="lastClass"
                        :label-page="labelPage"
                        :page-class="pageClass"
                        :hide-ellipsis="hideEllipsis"
                        :ellipsis-text="ellipsisText"
                        :ellipsis-class="ellipsisClass"
                        :size="paginationSize"
                        :aria-label="paginationAriaLabel"
                        :aria-controls="tableId"
                        class="mx-1"
                    >
                        <template v-for="(index, name) in $slots" #[name]="data">
                            <slot :name="name" v-bind="data" />
                        </template>
                    </BPagination>
                </div>
            </BCol>
        </BRow>
    </BOverlay>
</template>

<script>

import axios from 'axios';
import { isArray } from 'lodash';

const EVENT_UPDATE_PER_PAGE = 'update:per-page';
const EVENT_UPDATE_REFRESH = 'update:refresh';
const UPDATE_ITEMS = 'update:items';

export default {
    inheritAttrs: false,

    props: {
        dataUrl: { type: String, default: null },
        items: { type: Array, required: false, default: () => [] },
        perPage: { type: [String, Number], required: false, default: 20 },
        pagination: {
            type: [Boolean, String],
            required: false,
            default: true,
            validator: (value) => ['always', true, false].indexOf(value) !== -1,
        },
        pageLength: { type: Boolean, required: false, default: false },
        pageLengthOptions: { type: Array, required: false, default: () => [10, 20, 50, 75, 100] },
        pageLengthCols: { type: [String, Number], required: false, default: 5 },
        search: { type: Boolean, required: false, default: false },
        searchMinLength: { type: [String, Number], required: false, default: 0 },
        searchDebounce: { type: [String, Number], required: false, default: 150 },
        searchCols: { type: [String, Number], required: false, default: 5 },
        filter: { type: String, required: false, default: null },
        filterFunction: { type: Function, required: false, default: null },
        // See BTableSortBy: https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs/components/table.html#sorting
        sortBy: { type: Array, required: false, default: null },
        ssp: { type: Boolean, required: false, default: false },
        state: { type: Boolean, required: false, default: false },
        ariaLabel: { type: String, required: false, default: 'Pagination Table' },
        id: { type: String, required: false, default: null },
        // Pagination props
        limit: { type: [String, Number], required: false, default: 5 },
        align: { type: String, required: false, default: 'left' },
        pills: { type: Boolean, required: false, default: false },
        hideGotoEndButtons: { type: Boolean, required: false, default: false },
        labelFirstPage: { type: String, required: false, default: 'Go to first page' },
        firstText: { type: String, required: false, default: '«' },
        firstNumber: { type: Boolean, required: false, default: false },
        firstClass: { type: [String, Array, Object], default: null },
        labelPrevPage: { type: String, required: false, default: 'Go to previous page' },
        prevText: { type: String, required: false, default: '‹' },
        prevClass: { type: [String, Array, Object], default: null },
        labelNextPage: { type: String, required: false, default: 'Go to next page' },
        nextText: { type: String, required: false, default: '›' },
        nextClass: { type: [String, Array, Object], default: null },
        labelLastPage: { type: String, required: false, default: 'Go to last page' },
        lastText: { type: String, required: false, default: '»' },
        lastNumber: { type: Boolean, required: false, default: false },
        lastClass: { type: [String, Array, Object], default: null },
        labelPage: { type: String, required: false, default: 'Go to page' },
        pageClass: { type: [String, Array, Object], default: null },
        hideEllipsis: { type: Boolean, required: false, default: false },
        ellipsisText: { type: String, required: false, default: '…' },
        ellipsisClass: { type: [String, Array, Object], default: null },
        paginationSize: { type: String, default: null },
        paginationAriaLabel: { type: String, required: false, default: 'Pagination' },
        // Table refresh when using the dataUrl with or without SSP
        refresh: { type: Boolean, required: false, default: false },
        // Events consumed in this component that we need to bubble upwards.
        rowSelected: { type: Function, required: false, default: null },
    },

    data: () => ({
        tableData: [],
        filteredData: [],
        currentPage: 1,
        itemsPerPage: 20,
        rowCount: 0,
        filteredCount: 0,
        showLoading: false,
        rawSearchText: null,
        searchText: null,
        tableSortBy: null,
        tableSortDesc: false,
        localRefresh: false,
        pageSelectedIndexes: new Map(),
        uniqueId: null,
    }),

    computed: {
        firstPageRow() { return (this.pagination && this.filteredCount > 0 ? ((this.currentPage - 1) * this.itemsPerPage) + 1 : 0); },
        lastPageRow() {
            let lastPageRow = 0;
            if (this.pagination && this.filteredCount > 0) {
                lastPageRow = this.firstPageRow + this.filteredCount - 1;
                if (this.itemsPerPage < this.filteredCount) {
                    lastPageRow = this.firstPageRow + this.filteredCount - (
                        this.firstPageRow > this.itemsPerPage ? this.itemsPerPage : this.filteredCount - this.firstPageRow
                    );
                }
            }
            return lastPageRow;
        },
        pageCount() { return (this.pagination ? Math.ceil(this.filteredCount / this.itemsPerPage) : 1); },
        tableCurrentPage() { return (this.ssp ? 1 : this.currentPage); },
        stateName() { return `BPagination-table_${this.uniqueId}_${window.location.pathname}`; },
        tableId() { return this.id || `BPagination-table-${this.uniqueId}`; },
        showPagination() { return (this.pagination === 'always' || (this.pagination === true && this.pageCount > 1)); },
        tableFilter() { return this.filter || this.searchText; },
        filteredTableData() { return (this.filteredData.length > 0 ? this.filteredData : this.tableData); },
    },

    watch: {
        items: {
            handler(items) {
                this.tableData = items;
                this.rowCount = this.tableData.length;
                this.filteredCount = this.tableData.length;
                this.pageSelectedIndexes.clear();
            },
            immediate: true,
        },

        perPage: {
            handler(perPage) {
                this.itemsPerPage = (this.pagination ? Number(perPage) : 0);
            },
            immediate: true,
        },

        sortBy: {
            handler(newValue) {
                this.tableSortBy = newValue;
            },
            immediate: true,
        },

        sortDesc: {
            handler(newValue) {
                this.tableSortDesc = newValue;
            },
            immediate: true,
        },

        dataUrl: {
            handler() {
                this.refreshTableData();
            },
            immediate: true,
        },

        rawSearchText(newValue) {
            const len = String(newValue).length;
            if (len === 0 || len >= this.searchMinLength) {
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
            }
            this.$emit(EVENT_UPDATE_REFRESH, this.localRefresh);
        },
    },

    mounted() {
        this.uniqueId = this._.uid;
        if (this.state && localStorage.getItem(this.stateName)) {
            const tableState = JSON.parse(localStorage.getItem(this.stateName));
            if (tableState) {
                this.tableSortBy = isArray(tableState.tableSortBy) ? tableState.tableSortBy : this.tableSortBy;
                this.rawSearchText = tableState.rawSearchText || this.rawSearchText;
                this.itemsPerPage = (this.pagination ? (tableState.itemsPerPage || this.itemsPerPage) : 0);
                this.filteredCount = tableState.filteredCount || this.filteredCount;
                this.$nextTick(() => {
                    this.currentPage = tableState.currentPage || this.currentPage;
                    this.setFilteredPagePosition();
                });
            }
        }
        this.refreshTableData();
    },

    methods: {
        onTableSorted() {
            this.filteredData = this.$refs.table.sortedItems; // This is not a defined public property but really should be included in the event context
            this.saveState();
            this.clearSelectedItems();
        },

        saveState() {
            if (this.state) {
                this.$nextTick(() => {
                    const tableState = {
                        tableSortBy: this.tableSortBy,
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
            if (this.$refs.table) {
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
         * Return the table data. This can be a static list provided by the items prop or
         * or fetched from a URL source if the dataUrl prop is provided.
         * If the ssp prop is true, use Server Side Processing to filter and sort the data.
         * See 'Using BTableProvider'
         * https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs/components/table.html
         */
        async tableProvider(context) {
            if (this.dataUrl) {
                try {
                    const url = this.getPaginationUrl(context);
                    this.showLoading = true;
                    const result = await axios.get(url);
                    this.tableData = (Array.isArray(result.data.data) ? result.data.data : []);
                    if (result.data.totalCount) {
                        this.rowCount = result.data.totalCount;
                        this.filteredCount = result.data.filteredCount;
                    } else {
                        this.rowCount = this.tableData.length;
                        this.filteredCount = this.tableData.length;
                    }

                    this.$emit(UPDATE_ITEMS, this.tableData);
                } catch (error) {
                    this.tableData = [];
                    this.displayError(`An error occurred fetching the table data from ${context.apiUrl}: ${error.message}`);
                } finally {
                    this.pageSelectedIndexes.clear();
                    this.showLoading = false;
                }
            }
            return this.tableData;
        },

        getPaginationUrl(context) {
            // If we are not using server-side-pagination return the base URL and use the BTable internal filter.
            if (!this.ssp) {
                return this.dataUrl;
            }
            const url = new URL(this.dataUrl, window.location.href);
            const query = url.searchParams;
            // Global search filter
            if (context.filter) {
                query.set('filter', context.filter);
            }
            // Sorting
            if (context.sortBy) {
                query.set('orderBy', (context.sortBy.order === 'desc' ? '-' : '') + context.sortBy.key);
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
        },

        onRowSelected(rows) {
            if (!this.ssp) {
                const selectedIndexes = [];
                rows.forEach(function find(row) {
                    // Save ths index of the item in the data list, not the current page row index
                    selectedIndexes.push(this.filteredTableData.findIndex((item) => item === row));
                }, this);
                this.pageSelectedIndexes.set(this.currentPage, selectedIndexes);
            }
        },

        restoreSelectedRows() {
            if (this.pageSelectedIndexes.has(this.currentPage)) {
                const selectedIndexes = this.pageSelectedIndexes.get(this.currentPage);
                this.$nextTick(() => {
                    selectedIndexes.forEach(function set(index) {
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
            this.pageSelectedIndexes.forEach(function page(indexes) {
                indexes.forEach(function data(index) {
                    items.push(this.filteredTableData[index]);
                }, this);
            }, this);

            return items;
        },
    },
};
</script>
