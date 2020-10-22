<template>
    <b-overlay :show="showLoading" rounded="sm" variant="transparent" blur="1px">
        <b-row v-if="pageLength || search">
            <b-col cols="12" md="3">
                <b-form-group v-if="pageLength" label="Page length:" label-cols="5" class="mb-1">
                    <b-select size="sm" v-model="itemsPerPage" :options="pageLengthOptions" />
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
                <b-table ref="table" v-bind="$attrs" :items="tableItems" :id="tableId"
                    :per-page="itemsPerPage" :current-page="tableCurrentPage"
                    sort-by.sync="tableSortBy" sort-desc.sync="tableSortDesc"
                    :filter="tableFilter" @filtered="onTableFilter" v-on="$listeners"
                    :aria-label="ariaLabel">
                    <template v-for="(index, name) in $scopedSlots" v-slot:[name]="data">
                        <slot :name="name" v-bind="data"></slot>
                    </template>
                </b-table>
            </b-col>
        </b-row>
        <b-row v-if="pagination" class="mt-2">
            <b-col cols="6">
                <div v-if="rowCount != filteredCount" class=" float-left">Showing {{firstPageRow }} to {{ lastPageRow }} of {{ filteredCount }} filtered entries from {{ rowCount }}</div>
                <div v-else class=" float-left">Showing {{firstPageRow }} to {{ lastPageRow }} of {{ rowCount }} entries</div>
            </b-col>
            <b-col cols="6" class="mt-0">
                <div class="float-right">
                    <b-pagination ref="pagination" v-model="currentPage" :total-rows="filteredCount" :per-page="itemsPerPage" v-on="$listeners"
                    :limit="limit" :align="align" :pills="pills" :hide-goto-end-buttons="hideGotoEndButtons"
                    :label-first-page="labelFirstPage" :first-text="firstText" :first-number="firstNumber" :first-class="firstClass"
                    :label-prev-page="labelPrevPage" :prev-text="prevText" :prev-class="prevClass"
                    :label-next-page="labelNextPage" :next-text="nextText" :next-class="nextClass"
                    :label-last-page="labelLastPage" :last-text="lastText" :last-number="lastNumber" :last-class="lastClass"
                    :label-page="labelPage" :page-class="pageClass"
                    :hide-ellipsis="hideEllipsis" :ellipsis-text="ellipsisText" :ellipsis-class="ellipsisClass"
                    :size="paginationSize" :aria-label="paginationAriaLabel" :aria-controls="tableId">
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
        perPage: { type: Number, required: false, default: 20 },
        pagination: { type: Boolean, required: false, default: true },
        pageLength: { type: Boolean, required: false, default: false },
        pageLengthOptions: { type: Array, required: false, default: () => [ 10, 20, 50, 75, 100 ] },
        search: { type: Boolean, required: false, default: false },
        sortBy: { type: String, required: false, default: '' },
        sortDesc: { type: Boolean, required: false, default: false },
        searchMinLength: { type: Number, required: false, default: 0 },
        searchDebounce: { type: Number, required: false, default: 150 },
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
    },

    data() {
        return {
            tableItems: [],
            currentPage: 1,
            itemsPerPage: 20,
            rowCount: 0,
            filteredCount: 0,
            showLoading: false,
            rawSearchText: null,
            searchText: null,
            tableSortBy: '',
            tableSortDesc: false,
        }
    },

    computed: {
        tableFilter() {
            return (this.ssp ? null : this.searchText);
        },

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

        tableCurrentPage() {
            return (this.ssp ? 1 : this.currentPage);
        },

        stateName() {
            return `b-pagination-table_${this._uid }_${window.location.pathname}`;
        },

        tableId() {
            return `b-pagination-table-${this._uid }`;
        }
    },

    watch: {
        items: {
            handler(items) {
                this.tableItems = (Array.isArray(items) ? items: []);
                this.rowCount = this.filteredCount = this.tableItems.length;
            },
            immediate: true
        },

        perPage: {
            handler(perPage) {
                this.itemsPerPage = perPage;
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

        sortBy: {
            handler(newValue) {
                this.tableSortBy = newValue;
            },
            immediate: true
        },

        tableSortBy() {
            this.saveState();
        },

        sortDesc: {
            handler(newValue) {
                this.tableSortDesc = newValue;
            },
            immediate: true
        },

        tableSortDesc() {
            this.saveState();
        },

        dataUrl: {
            handler() {
                this.fetchData();
            },
            immediate: true
        },

        itemsPerPage(itemsPerPage) {
            this.$emit('input:per-page', itemsPerPage);
            this.sspUpdate();
            this.saveState();
        },

        currentPage() {
            this.sspUpdate();
            this.saveState();
        },

        searchText() {
            this.sspUpdate();
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
        sspUpdate() {
            if (this.ssp) {
                // Fetch the new filtered row data
                this.fetchData();
            }
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

        fetchData: async function() {
            if (this.dataUrl) {
                try {
                    let url = this.setPaginationParams(this.dataUrl);
                    this.showLoading = true;
                    let result = await axios.get(url);
                    this.tableItems =  (Array.isArray(result.data.data) ? result.data.data: []);
                    if (result.data.totalCount) {
                        this.rowCount = result.data.totalCount;
                        this.filteredCount = result.data.filteredCount;
                    } else {
                        this.rowCount = this.filteredCount = this.tableItems.length;
                    }

                    this.$emit('update:items', this.tableItems);
                }
                catch (error) {
                    this.displayError(`An error accured fetching the table data from ${this.dataUrl}: ${error.message}`);
                }
                finally {
                    this.showLoading = false;
                }
            }
        },

        setPaginationParams(baseUrl) {
            // If we are not using server-side-pagination return the original, use the b-table filter
            if (!this.ssp) {
                return baseUrl;
            }
            let url = new Url(baseUrl, {}, true);
            let query = url.query;
            // Global search filter
            if (this.searchText) {
                 query.filter = this.searchText;
            }
            // Sorting
            if (this.tableSortBy) {
                query.orderBy = (this.tableSortDesc ? '-' : '' ) + this.tableSortBy;
            }
            // Pagination
            query.pageStart = (this.firstPageRow > 0 ? this.firstPageRow - 1 : 0);
            query.pageLength = this.itemsPerPage;

            url.set('query', query);
            return url.toString();
        },

        onTableFilter(items, count) {
            this.filteredCount = count;
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
