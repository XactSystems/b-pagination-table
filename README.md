# b-pagination-table
A pagination table for BootstrapVue with AJAX fetch and server side pagination options.

Internally the component uses b-pagination and b-table combined into a single component. All the props and slots for both sub-components can be applied to b-pagination-table. Any arbitrary attributes are applied to the b-table component via $attrs.

You can supply a list of items or provide a URL to fetch the data.


## Installation

### Add the component to your project
```
npm install @xactsystems/b-pagination-table
```

### Use it in your Vue app
```
<template>
    <b-pagination-table small striped :data-url="dataUrl" :fields="fields">
        <template v-slot:cell(id)="row">
            <a href="/view/{{ row.value }}">Item:{{ row.value }}</a>
        </template>
    </b-pagination-table>
</template>

<script>

import BPaginationTable from 'b-pagination-table'

export default {
    Components: {
        'b-pagination-table: BPaginationTable,
    },

    data() {
        return {
            dataUrl: '/my-list',
            fields: [
                { key: 'id', label: 'Item' },
                { key: 'description', label: 'Description' }
            ]
        }
    }
...
}
```


## Component props
| Prop                    | Type    | Default Value           | Description                                                                                                                                                                       |
|-------------------------|---------|-------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| data-url                | String  | null                    | The URL to fetch the table data from.                                                                                                                                             |
| items                   | Array   | []                      | Array of items to show in the table. You do not need to use this if you are using data-url unless you want to sync the returned items via the update:items event.                 |
| pagination              | Boolean or String | true          | If set to 'always', always show the pagination component. If set to true, show the pagination component if the page count is greater then 1. If false pagination is never shown.  |
| page-length             | Boolean | false                   | Show the page-length dropdown.                                                                                                                                                    |
| per-page                | Number  | 20                      | The initial page length of the table.                                                                                                                                             |
| page-length-options     | Array   | [ 10, 20, 50, 75, 100 ] | Options for the page length dropdown.                                                                                                                                             |
| search                  | Boolean | false                   | Show the search text input.                                                                                                                                                       |
| sort-by                 | String  | ''                      | The key of the initial sort column.                                                                                                                                               |
| sort-desc               | Boolean | false                   | Set to true to sort sort-by descending order.                                                                                                                                     |
| search-min-length       | Number  | 0                       | The minimum number of character to enter in the search text input before filtering the table results.                                                                             |
| search-debounce         | Number  | 150                     | The number of milliseconds to wait between changes to the table filter when searching.                                                                                            |
| ssp                     | Boolean | false                   | Set to true to use Server-Side-Processing for pagination.                                                                                                                         |
| state                   | Boolean | false                   | Set to true to save the table state, this will save page-length, search text and the current page number and set these again when the component is re-mounted or the page loaded. |
| pagination-size         | String  | 'md'                    | The size of the pagination component. This maps to the 'size' prop in b-pagination.                                                                                               |
| pagination-aria-label   | String  | 'md'                    | The ARIA label of the pagination component. This maps to the 'aria-label' prop in b-pagination.                                                                                   |


Please review the full set of props for both the b-table and the b-pagination components:

https://bootstrap-vue.org/docs/components/table

https://bootstrap-vue.org/docs/components/pagination


## Events
All the events of both b-table and b-pagination are exposed. In addition the following events are emitted:
|Event         |Payload       |Details                                                          |
|--------------|--------------|-----------------------------------------------------------------|
|input:per-page|Number, String| The size of the page length after the dropdown value is changed.|
|update:items  |Array         | The array of item data fetched from the data-url source.        |


## Server Side Processing
The component allows pagination on the back-end server by providing page relative query parameters to the fetch url. This is enabled by setting the ssp prop to true.

### SSP Query Parameters
|Parameter|Description                                                                                                     |
|---------|----------------------------------------------------------------------------------------------------------------|
|filter   | The search text to filter the results by.                                                                      |
|orderBy  | Provides the key to sort the results by. If this is preceded by '-' the results should be sorted as descending.|
|pageStart| The first row number the results should start at.                                                              |
|pageLength| The maximum number of rows to return.                                                                         |

### SSP Returned Data
|Parameter|Description                                                                                                     |
|---------|----------------------------------------------------------------------------------------------------------------|
|returnedCount| The number of records returned in the current response.                                                    |
|totalCount   | The total number of records available in the result set.                                                   |
|filteredCount| The number of filtered records available in the result set.                                                |
|data         | The current page records returned in the response.                                                                         |
