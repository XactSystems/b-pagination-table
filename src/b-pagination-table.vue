<template>
    <b-overlay :show="showLoading" rounded="sm" variant="transparent" blur="1px">
        <b-row v-if="pageLength || search">
            <b-col cols="12" md="3">
                <b-form-group v-if="pageLength" label="Page length:" label-cols="5" class="mb-1">
                    <b-select size="sm" v-model.number="itemsPerPage" :options="pageLengthOptions" />
                </b-form-group>
            </b-col>
            <b-col />
            <b-col cols="12" md="4">
                <b-form-group v-if="search" label="Search:" label-cols="3" class="mb-1">
                    <b-input size="sm" v-model="rawSearchText" debounce="searchDebounce" />
                </b-form-group>
            </b-col>
        </b-row>
        <b-row>
            <b-col>
                <b-table ref="table" v-bind="$attrs" :items="tableItemsOrFunc" :id="tableId"
                    :api-url="dataUrl" :per-page="itemsPerPage" :current-page="tableCurrentPage"
                    :sort-by.sync="tableSortBy" :sort-desc.sync="tableSortDesc"
                    :filter="searchText" @filtered="onTableFilter" @sort-changed="onTableSortChanged"
                    v-on="$listeners" :aria-label="ariaLabel">
                    <template v-for="(index, name) in $scopedSlots" v-slot:[name]="data">
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
                    <b-pagination v-if="showPagination" ref="pagination" v-model="currentPage" :total-rows="filteredCount" :per-page="itemsPerPage" v-on="$listeners"
                        :limit="limit" :align="align" :pills="pills" :hide-goto-end-buttons="hideGotoEndButtons"
                        :label-first-page="labelFirstPage" :first-text="firstText" :first-number="firstNumber" :first-class="firstClass"
                        :label-prev-page="labelPrevPage" :prev-text="prevText" :prev-class="prevClass"
                        :label-next-page="labelNextPage" :next-text="nextText" :next-class="nextClass"
                        :label-last-page="labelLastPage" :last-text="lastText" :last-number="lastNumber" :last-class="lastClass"
                        :label-page="labelPage" :page-class="pageClass"
                        :hide-ellipsis="hideEllipsis" :ellipsis-text="ellipsisText" :ellipsis-class="ellipsisClass"
                        :size="paginationSize" :aria-label="paginationAriaLabel" :aria-controls="tableId"
                        class="mx-1">
                        <template v-for="(index, name) in $scopedSlots" v-slot:[name]="data">
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
import Url from 'url-parse';

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
        search: { type: Boolean, required: false, default: false },
        sortBy: { type: String, required: false, default: '' },
        sortDesc: { type: Boolean, required: false, default: false },
        searchMinLength: { type: [String, Number], required: false, default: 0 },
        searchDebounce: { type: [String, Number], required: false, default: 150 },
        ssp: { type: Boolean, required: false, default: false },
        state: { type: Boolean, required: false, default: false },
        ariaLabel: { type: String, required: false, default: 'Pagination Table' },
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
    },

    data() {
        return {
            tableData: [],
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
        }
    },

    computed: {
        firstPageRow() {
            return this.filteredCount > 0 ? ((this.currentPage - 1) * this.itemsPerPage) + 1 : 0;
        },

        lastPageRow() {
            return this.filteredCount > 0 ? (
                this.firstPageRow + (this.itemsPerPage < this.filteredCount ? (
                    this.filteredCount - this.firstPageRow > this.itemsPerPage ? this.itemsPerPage : this.filteredCount - this.firstPageRow + 1
                 ) : this.filteredCount) - 1
            ) : 0;
        },

        pageCount() {
            return Math.ceil(this.filteredCount / this.itemsPerPage);
        },

        tableCurrentPage() {
            return (this.ssp ? 1 : this.currentPage);
        },

        stateName() {
            return `b-pagination-table_${this._uid }_${window.location.pathname}`;
        },

        tableId() {
            return `b-pagination-table-${this._uid }`;
        },

        showPagination() {
            return (this.pagination == 'always' || (this.pagination == true && this.pageCount > 1));
        },

        tableItemsOrFunc() {
            // If using SSP we must use the items provider function
            if (this.ssp) {
                return this.fetchFilteredItems;
            }
            return this.tableData;
        }
    },

    watch: {
        items: {
            handler(items) {
                this.tableData = items;
                this.rowCount = this.filteredCount = this.tableData.length;
            },
            immediate: true
        },

        perPage: {
            handler(perPage) {
                this.itemsPerPage = Number(perPage);
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

        itemsPerPage(itemsPerPage) {
            this.$emit('update:per-page', itemsPerPage);
            // Reset the page number if it's now outside of the possible range
            if (Math.ceil(this.rowCount / this.itemsPerPage) < this.currentPage) {
                this.currentPage = Math.ceil(this.rowCount / this.itemsPerPage);
            }
            this.saveState();
        },

        currentPage() {
            this.saveState();
        },

        refresh(refresh) {
            this.localRefresh = refresh;
        },

        localRefresh(refresh) {
            if (refresh) {
                this.refreshTableData();
                this.$nextTick(function() {
                    this.refresh = false;
                });
            }
            this.$emit('update:refresh', this.localRefresh);
        },
    },

    mounted() {
        if (this.state && localStorage.getItem(this.stateName)) {
            let tableState = JSON.parse(localStorage.getItem(this.stateName));
            if (tableState) {
                this.tableSortBy = tableState.tableSortBy || this.tableSortBy;
                this.tableSortDesc = tableState.tableSortDesc || this.tableSortDesc;
                this.rawSearchText = tableState.rawSearchText || this.rawSearchText;
                this.itemsPerPage = tableState.itemsPerPage || this.itemsPerPage;
                this.filteredCount = tableState.filteredCount || this.filteredCount;
                this.$nextTick(function() {
                    this.currentPage = tableState.currentPage || this.currentPage;
                });
            }
        }
    },

    methods: {
        onTableSortChanged() {
            this.saveState();
        },

        saveState() {
            if (this.state) {
                let tableState = {
                    tableSortBy: this.tableSortBy,
                    tableSortDesc: this.tableSortDesc,
                    rawSearchText: this.rawSearchText,
                    itemsPerPage: this.itemsPerPage,
                    filteredCount: this.filteredCount,
                    currentPage: this.currentPage,
                };
                localStorage.setItem(this.stateName, JSON.stringify(tableState));
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

                    this.$emit('update:items', this.tableData);
                }
                catch (error) {
                    this.tableData = [];
                    this.displayError(`An error accured fetching the table data from ${context.apiUrl}: ${error.message}`);
                }
                finally {
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
            let url = new Url(context.apiUrl, {}, true);
            let query = url.query;
            // Global search filter
            if (context.filter) {
                 query.filter = context.filter;
            }
            // Sorting
            if (context.sortBy) {
                query.orderBy = (context.sortDesc ? '-' : '' ) + context.sortBy;
            }
            // Pagination
            query.pageStart = (this.firstPageRow > 0 ? this.firstPageRow - 1 : 0);
            query.pageLength = context.perPage;

            url.set('query', query);
            return url.toString();
        },

        onTableFilter(items, count) {
            this.filteredCount = (this.ssp ? this.filteredCount : count);
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

        isRowSelected(index) {
            this.$refs.table.isRowSelected(index);
        },
    }
}
</script>
