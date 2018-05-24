import React, { Component } from 'react';

import {
    Table, Card, CardImg, CardText, CardBody,
    CardTitle, CardSubtitle, Dropdown, DropdownToggle, Button, DropdownMenu, DropdownItem
} from 'reactstrap';

import { GetUrlParams, Location } from './../../Utils/location.utils';
import { GetMenuDetail, ConvertMenuDetailForGenericPage, CreateFinalColumns } from './../../Utils/generic.utils';
import { GetListingRecord } from './../../Utils/genericListing.utils';
import { SubscribeToEvent, UnsubscribeEvent, StoreEvent } from './../../Utils/stateManager.utils';

import DynamicFilter from './../../Components/Dynamic-Filter/dynamicFilter.component';
import ConfigureDynamicFilter from './../../Components/Dynamic-Filter/configureFilter.component';

import ListingPagination from './../../Components/Listing-Pagination/ListingPagination';
import TableSettings from './../../Components/Table-Settings/TableSettings.component';
import PortletTable from './../../Components/Portlet-Table/PortletTable.component';
import CustomAction from './../../Components/Custom-Action/CustomAction.component';

import ModalManager from './../../Wrappers/Modal-Wrapper/modalManager';
import ModalWrap from './../../Wrappers/Modal-Wrapper/modalWrapper.component';

import PredefinedFilter from './../../Components/Dropdown-Filter/filter.component';
import ListingSearch from './../../Components/Generic-Listing-Search/genericListingSearch.component';
import { HotKeys } from 'react-hotkeys';
import { CopyToClipBoard } from './../../Utils/common.utils';
import ToastNotifications from './../../Utils/toast.utils';
import { Get } from './../../Utils/http.utils';
import { BuildUrlForGetCall } from './../../Utils/common.utils';
import { GetDefaultOptions } from './../../Utils/genericListing.utils';

import './genericListing.css';


export default class GenericListing extends Component {
    filterContent = {};
    urlParams = Location.search();

    // Preparing option for right click
    rowOptions = [{
        id: 0,
        name: "Copy Row Id",
        icon: 'fa-copy',
        subMenu: false,
        onClick: (data) => {
            let id = data.listingRow.id;
            CopyToClipBoard(id);
            ToastNotifications.success("Id - " + id + " has been copied");
        },
        disabled: false
    }, { subMenu: null }, {
        id: 1,
        name: "Show Matching",
        icon: 'fa-retweet',
        subMenu: false,
        onClick: (data) => {
            this.filterTable(data, [" LIKE ", " = "]);
            return data.selectedColumn.path.split(".").length < 3;
        },
        disabled: false
    }, {
        id: 2,
        name: "Filter Out",
        icon: 'fa-columns',
        subMenu: false,
        onClick: (data) => {
            this.filterTable(data, [" NOT LIKE ", " != "]);
            return data.selectedColumn.path.split(".").length < 3;
        },
        disabled: false
    }, {
        id: 3,
        name: "Filter More",
        icon: 'fa-filter',
        subMenu: false,
        onClick: (data) => {
            this.filterColumn(data.selectedColumn);
            return data.selectedColumn.path.split(".").length < 3;
        },
        disabled: false
    }, {
        id: 4,
        name: "Aggregation",
        icon: 'fa-chart-line',
        subMenu: true,
        onClick: (data, operator) => {
            console.log(data, operator);
            this.openAggregationResult(operator.name.toLowerCase(), operator.name + ' of ' + data.selectedColumn.display_name + ' equals : ', data)
        }, disabled: (data) => {
            return (data.selectedColumn.path.split('.').length != 1)
        }
    }, { subMenu: null },
    {
        id: 4,
        name: "Redirect Menu Detail",
        icon: 'fa-deaf',
        subMenu: false,
        onClick: (data) => {
            const { history, match } = this.props;

            let pageUrl = "/menuDef/" + data.menuDetail.menuId

            history.push(`${pageUrl}`);
        },
        disabled: false
    }, {
        id: 4,
        name: "Redirect Model Detail",
        icon: 'fa-info-circle',
        subMenu: false,
        onClick: (data) => {
            const { history, match } = this.props;

            let pageUrl = "/modelDetails/" + data.menuDetail.model.id

            history.push(`${pageUrl}`);
        },
        disabled: false
    }];

    openAggregationResult = async (operator, caption, data) => {

        let options = GetDefaultOptions();
        options.aggregation_column = data.selectedColumn.column_name;
        options.aggregation_operator = operator;

        const url = BuildUrlForGetCall(data.menuDetail.url, options);

        const result = await Get({ url });

        if (result.success) {
            ToastNotifications.success(caption + result.response);
        }
    }

    filterTable = (data, method) => {

        const paramProps = {
            history: data.history, match: data.match
        };

        console.log(data, method);
        let query = '';
        if (data.selectedColumn.path.split(".").length == 1) { // for columns which is child of table itself
            if (this.urlParams.query) { // if previous query present then it will executed
                let a = {};
                let f = 0;
                a = this.urlParams.query.split(" AND ");
                for (let i = 0; i < a.length; i++) { // for checking overlapping query
                    let b = {};
                    let newquery;
                    b = a[i].split(" LIKE ");
                    if (newquery == b[0]) {
                        f = 1;
                    }
                }
                if (f == 0) { // if not overlappin

                    query = this.urlParams.query + ' AND ' + data.selectedColumn.column_name + method[0] + "'" + data.listingRow[data.selectedColumn.column_name] + "'";

                    this.urlParams.query = query;
                    Location.search(this.urlParams, { props: paramProps });
                } else { // if overlappin

                    query = this.urlParams.query;

                    this.urlParams.query = query;
                    Location.search(this.urlParams, { props: paramProps });
                }
            } else { // if previous query not present then it will executed

                query = data.selectedColumn.column_name + method[0] + "'" + data.listingRow[data.selectedColumn.column_name] + "'";

                this.urlParams.query = query;
                Location.search(this.urlParams, { props: paramProps });
            }
        } else if (data.selectedColumn.path.split(".").length == 2) { // This will executed when showmatching clicked second time
            let regex = /.([^.]*)$/; // filters out anything before first '.'
            let path = data.selectedColumn.path.replace(regex, "");
            if (this.urlParams.query) { // if previous query present then it will executed
                let newquery = data.selectedColumn["parentColumn"];
                let a = {};
                let f = 0;
                a = this.urlParams.query.split(" AND ");
                for (let i = 0; i < a.length; i++) { // for checking overlapping query
                    let b = {};
                    b = a[i].split(" = ");
                    if (newquery == b[0]) {
                        f = 1;
                    }
                }
                if (f == 0) { // if not overlapping
                    query = this.urlParams.query + ' AND ' + data.selectedColumn["parentColumn"] + method[1] + "'" + data.listingRow[path]["id"] + "'";
                    Location.search({
                        query: query
                    });
                } else { // if overlapping
                    query = this.urlParams.query;
                    Location.search({
                        query: query
                    });
                }
            } else { // if previous query not present then it will executed

                query = data.selectedColumn["parentColumn"] + method[1] + "'" + data.listingRow[path]["id"] + "'";

                this.urlParams.query = query;

                Location.search(this.urlParams, { props: paramProps });
            }
        }
    }

    filterColumn = (column) => {
        let selected;
        if (column.path.split(".").length == 1) { // for columns which is child of table itself
            selected = column.column_name;
        } else if (column.path.split(".").length == 2) { // for reference columns (for e.g. Created by table in with any menu)
            selected = column.parentColumn;
        }

        if (typeof this.toggleAdvancedFilter == 'function') {
            this.toggleAdvancedFilter({ single: selected });
        }
    };

    constructor(props) {
        super(props);
        this.state = {
            ...GetUrlParams(this.props), // params, queryString
            menuDetail: {},
            genericData: {},
            filterContent: null,
            isCollapsed: true
        };
        SubscribeToEvent({ eventName: 'loggedUser', callback: this.userDataArrived });
    }

    keyMap = {
        moveUp: 'shift+r',
    }
    handlers = {
        'moveUp': (event) => this.getListingData()
    }

    componentWillReceiveProps(nextProps) {
        const newProps = GetUrlParams(nextProps);
        this.state.params = newProps.params;
        this.state.queryString = newProps.queryString;
        if (this.state.menuDetail.url) {
            this.getListingData();
        }
    }

    toggleAdvancedFilter = (payload = {}) => {
        const { isCollapsed } = this.state;
        this.setState({ isCollapsed: !isCollapsed });
        StoreEvent({ eventName: 'ToggleAdvancedFilter', data: { isCollapsed: !isCollapsed, ...payload } });
    }

    componentDidMount() {
        // this.getMenuData();
        // ModalManager.showModal({ onClose: this.closeModal, headerText: '1st using method', modalBody: () => (<h1> hi</h1>) });
    }

    componentWillUnmount() {
        // UnsubscribeEvent({ eventName: 'loggedUser', callback: this.userDataArrived });
    }

    userDataArrived = (user) => {
        this.state.currentUser = user;
        this.getMenuData();
        // this.setState({ currentUser: data });
    }

    getMenuData = async () => {
        const { queryString } = this.state;
        const { menuId, limit, page } = this.props;
        const result = await GetMenuDetail(menuId);
        if (result.success) {

            const { response = {} } = result;
            const menuDetail = ConvertMenuDetailForGenericPage(response || {});
            if (typeof response.controller_path == 'string' && response.controller_path.includes('genericListingController.js') != -1) {
                // this.setState({ menuDetail });
                this.state.menuDetail = menuDetail
                this.getListingData();
                StoreEvent({ eventName: 'showMenuName', data: { menuName: this.state.menuDetail.pageName } });
            }
        }
    }

    getListingData = () => {
        const { menuDetail, genericData, queryString, currentUser } = this.state;
        GetListingRecord({ configuration: menuDetail, callback: this.dataFetched, data: genericData, queryString, currentUser });
    }


    convertIt = (str) => {
        return str.replace(/.([^.]*)$/, "");
    }

    rowTemplate = ({ listingRow, selectedColumn }) => {
        let val;

        if (selectedColumn.route) {
            let id;
            if (selectedColumn.path.split('.')[1]) {
                id = this.convertIt(selectedColumn.path);
                id = eval('listingRow.' + id).id;
            } else {
                id = listingRow.id;
            }
            val = <a href={`${selectedColumn.reference_route}${id}`} >{eval('listingRow.' + selectedColumn.path)}</a>
        } else {
            try {
                val = eval('listingRow.' + selectedColumn.path);
            } catch (e) {
                val = null;
            }
        }
        return (<span>{val}</span>);
    }



    dataFetched = ({ genericData, filterContent }) => {
        // const totalPages = Math.ceil((genericData.stats.records / genericData.stats.count));

        // if (totalPages > 7) {
        //     // this.setState({ pagesOnDisplay: 7 });
        //     this.state.pagesOnDisplay = 7;
        // } else {
        //     // this.setState({ pagesOnDisplay: totalPages });
        //     this.state.pagesOnDisplay = Math.ceil(totalPages);
        // }
        this.setState({ genericData, filterContent });
    }

    predefinedFiltersUpdated = (filters) => {
        const { menuDetail } = this.state;
        menuDetail.userFilter = filters;
        this.setState({ menuDetail });
    }

    layoutChanges = (selectedColumns) => {
        let { genericData } = this.state;
        genericData.selectedColumns = selectedColumns;
        genericData.finalColumns = CreateFinalColumns(genericData.columns, selectedColumns, genericData.relationship);
        this.setState({ genericData });
    }

    refreshPage() {
        this.getListingData();
    }

    render() {
        const { genericData = {}, pagesOnDisplay, menuDetail = {}, filterContent, currentUser } = this.state;
        const { listing = [], finalColumns = [] } = genericData;
        const { history, match } = this.props;
        return (


            <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
                <div className="generic-listing-container">
                    {/* <ModalWrap
                    isVisible
                    headerText="tesfh"
                    modalBody={() => (<h1> h2</h1>)}
                    closeModal={() => this.setState({ isVisible: false })}
                /> */}
                    <div className="page-bar">
                        <div className="search-bar">

                            <div className="generic-listing-search">
                                {
                                    filterContent && filterContent.dictionary &&
                                    <ListingSearch history={history} match={match} dictionary={filterContent.dictionary} />
                                }
                            </div>

                            <div className="search-wrapper">
                                {
                                    filterContent && filterContent.dictionary &&
                                    <DynamicFilter toggleAdvancedFilter={this.toggleAdvancedFilter} menuUpdatedCallback={this.predefinedFiltersUpdated} selectedColumns={genericData.selectedColumns} menuId={menuDetail.menuId} currentUser={currentUser} dictionary={filterContent.dictionary} userFilters={menuDetail.userFilter} history={history} match={match} />
                                }
                            </div>
                        </div>

                        <div className="header-actions">

                            <div className="btn-group" role="group" aria-label="Basic example">

                                <Button color="primary" size="sm" onClick={() => { this.refreshPage() }}>
                                    <i className="fa fa-refresh"></i>
                                </Button>

                                <CustomAction history={history} genericData={genericData} actions={genericData.nextActions} placement={168} />

                                {
                                    genericData.columns ?
                                        <TableSettings
                                            onSubmit={this.layoutChanges}
                                            listName={genericData.listName}
                                            selectedColumns={genericData.selectedColumns}
                                            columns={genericData.columns}
                                        />
                                        :
                                        null
                                }
                            </div>
                            {
                                menuDetail.userFilter ?
                                    <PredefinedFilter onFilterUpdate={this.predefinedFiltersUpdated} userFilter={menuDetail.userFilter} history={history} match={match} />
                                    :
                                    null
                            }
                        </div>
                    </div>

                    <div>
                        {
                            filterContent &&
                            <ConfigureDynamicFilter
                                history={history}
                                match={match}
                                filters={menuDetail.userFilter}
                                content={filterContent}
                            />
                        }
                    </div>

                    {
                        (finalColumns && finalColumns.length)

                        &&
                        <Card>
                            <CardBody className="table-wrapper">

                                {/* Portlet Table */}

                                {
                                    (finalColumns && finalColumns.length) &&
                                    <PortletTable rowTemplate={this.rowTemplate} tableType="listing" rowOptions={this.rowOptions}
                                        toggleAdvancedFilter={this.toggleAdvancedFilter} history={history} match={match} genericData={genericData} finalColumns={finalColumns} listing={listing} callback={this.getListingData} menuDetail={menuDetail} />
                                }

                                {/* Portlet Table Ends */}

                            </CardBody>
                        </Card>
                    }

                    {
                        (finalColumns && finalColumns.length)

                        &&
                        <ListingPagination history={history} match={match} currentPage={genericData.currentPage} statsData={genericData.stats} />
                    }
                    {/* Listing Pagination Ends */}

                </div>
            </HotKeys>
        );
    }
}