import React from 'react';

import { Location } from 'drivezy-web-utils/build/Utils/location.utils';
import { ToastNotifications, ModalManager } from 'drivezy-web-utils/build/Utils';
import { ConfirmUtils } from 'drivezy-web-utils/build/Utils/confirm.utils';

import { Get, Delete, IsUndefinedOrNull, BuildUrlForGetCall, IsObjectHaveKeys } from 'common-js-util';

import { ProcessForm } from './formMiddleware.utils';
// import { GetUser } from './user.utils';

import ParseComponent from './../Components/Generic-Column-Filters/parseComponent.component';

import TableWrapper from './../Components/Table-Wrapper/tableWrapper.component';
import PreferenceSetting from './../Components/Preference-Setting/preferenceSetting.component';

import { GetMenuDetailEndPoint, FormDetailEndPoint } from './../Constants/api.constants';
import { ROUTE_URL, RECORD_URL } from './../Constants/global.constants';
import { MATCH_PARENT_PATH, MATCH_START_END_PARANTHESIS, MATCH_WHITESPACE } from './../Constants/regex.constants';
import COLUMN_TYPE from './../Constants/columnType.constants';

/**
 * Fetches Menu detail to render generic page
 * @param  {id} menuId
 * @param  {function} callback
 */
export function GetMenuDetail(menuId, callback) {
    const url = GetMenuDetailEndPoint + menuId;
    return Get({ url, callback, persist: callback ? true : false, urlPrefix: RECORD_URL });
}

/**
 * takes query as string & evaluates them
 * replace string variable to their value
 * @param  {string} params
 * @returns evaluated query
 */
export function ConvertToQuery(params) {
    const reg = /(:[$\w.]*)\w+/g;
    const tempArr = params.match(reg);

    for (const i in tempArr) {
        if (tempArr[i] && typeof tempArr[i] == 'string') {
            const a = eval('this.' + tempArr[i].split(':')[1]);
            const b = tempArr[i];
            params = params.replace(b, a);
        }
    }
    return params;
}

/**
 * takes dictionary and relationship and create object having key combination of its parent and id
 * used for getting list of columns in above explained format which is again used by CreateFinalColumns method to return selected columns
 * @param  {string} {includes
 * @param  {object} relationship
 * @param  {string} starter
 * @param  {object} dictionary
 * @param  {boolean} excludeStarter}
 */
export function GetColumnsForListing({ includes, relationship, starter, dictionary, excludeStarter, includesList = [] }, excludeParent = false) {
    const columns = [];
    const dictionaryColumns = {};
    // const includesList = [];

    if (!(Array.isArray(includesList) && includesList.length)) {
        const includesArr = includes.split(',');
        includesList = [];
        for (const i in includesArr) {
            const tempIncludes = includesArr[i].split('.');
            let newStarter = starter;
            for (const j in tempIncludes) {
                newStarter += `.${tempIncludes[j]}`;
                includesList.push(newStarter);
            }
        }
        !excludeStarter ? includesList.unshift(starter) : null;
    }


    for (const i in includesList) {
        columns[includesList[i]] = dictionary[(includesList[i])];
    }
    // columns = dictionary;
    for (const i in columns) {
        // const data = columns[i];
        for (const j in columns[i]) {
            const selectedColumn = {};

            const element = !excludeParent ? `${i}.${columns[i][j].name}` : columns[i][j].name;
            // const element = `${i}.${columns[i][j].name}`;

            // columns[i][j].path = element.replace(/\.?([A-Z]+)/g, (x, y) => {
            //     return `_${y.toLowerCase()}`;
            // }).replace(/^_/, '').replace(starter, '').replace('.', '');
            selectedColumn.parent = i;

            selectedColumn.path = element;
            selectedColumn.column_type_id = columns[i][j].column_type_id;
            selectedColumn.model_id = columns[i][j].model_id
            selectedColumn.name = columns[i][j].name;
            selectedColumn.visibility = columns[i][j].visibility;
            selectedColumn.required = columns[i][j].required;
            selectedColumn.nullable = columns[i][j].nullable;
            selectedColumn.reference_model = columns[i][j].reference_model;
            selectedColumn.display_name = columns[i][j].display_name;

            const relationIndex = columns[i][j].parent;
            if (!IsUndefinedOrNull(relationship) && relationship.hasOwnProperty(relationIndex)) {
                if (relationship[relationIndex].hasOwnProperty('related_model')) {
                    selectedColumn.reference_route = relationship[relationIndex].related_model.state_name;
                    selectedColumn.parentColumn = relationship[relationIndex].related_column ? relationship[relationIndex].related_column.name : null;
                } else if (relationship[relationIndex].state_name) {
                    selectedColumn.reference_route = relationship[relationIndex].state_name;
                }
            }

            // const index = selectedColumn.parent + '.' + selectedColumn.name;
            const index = !excludeParent ? selectedColumn.parent + '.' + selectedColumn.name : selectedColumn.name;
            dictionaryColumns[index] = selectedColumn;
            // dictionaryColumns[`${columns[i][j].parent}.${columns[i][j].id}`] = columns[i][j];
        }

    }
    return dictionaryColumns;
}

/**
 * returns final list of selected columns to be shown on each car for each row
 * Takes columns list being prepared by 'GetColumnsForListing' method, preference list and relationship
 * same as TableFactory.createFinalObject
 * @param  {object} columns
 * @param  {object} selectedColumns
 * @param  {object} relationship
 */
export function CreateFinalColumns(columns, selectedColumns, relationship) {
    const finalColumnDefinition = [];
    let splitEnabled = false;
    let defaultColumns = false;
    // const selectedColumns = GetSelectedColumnDefinition(layout);

    if (selectedColumns && selectedColumns.length == 0) {
        for (const i in columns) {
            selectedColumns.push({
                object: columns[i].parent, column: columns[i].name, headingCollapsed: true, heading: "", index: i
            });
            if (selectedColumns.length < 6) {
                continue;
            }
            else
                break;
        }
        defaultColumns = true;
    }

    for (const i in selectedColumns) {
        const selected = selectedColumns[i];
        if (!selected.split) {
            const dict = columns[selected.index];
            if (dict) {
                finalColumnDefinition[i] = dict;
                finalColumnDefinition[i].route = selected.route ? selected.route : false;
                finalColumnDefinition[i].display_name = selected.columnTitle ? selected.columnTitle : finalColumnDefinition[i].display_name;
                finalColumnDefinition[i].split = splitEnabled;
                // if (selected.filter) {
                finalColumnDefinition[i].filter = selected.filter;
                // }
                finalColumnDefinition[i].defaultLayout = defaultColumns;

                const relationIndex = dict.parent;

                if (!IsUndefinedOrNull(relationship) && relationship.hasOwnProperty(relationIndex) && (relationship[relationIndex].menu_url || relationship[relationIndex].hasOwnProperty('reference_model'))) {
                    finalColumnDefinition[i].menu_url = relationship[relationIndex].menu_url || relationship[relationIndex].reference_model.menu_url;
                }
                // if (!IsUndefinedOrNull(relationship) && relationship.hasOwnProperty(relationIndex)) {
                //     if (relationship[relationIndex].hasOwnProperty('related_model')) {
                //         finalColumnDefinition[i].reference_route = relationship[relationIndex].related_model.state_name;
                //     } else if (relationship[relationIndex].state_name) {
                //         finalColumnDefinition[i].reference_route = relationship[relationIndex].state_name;
                //     }
                // }
            }
        } else if (selected.separator) {
            finalColumnDefinition[i] = { ...selected, isSplit: false }
            splitEnabled = false;
        }
        else {
            finalColumnDefinition[i] = { ...selected, isSplit: true }
            splitEnabled = !splitEnabled;

        };
        // finalColumnDefinition[i] = {
        //     name: selected, column_type: null
        // };

        // if it is a seperator
        if (selected.name == "seperator") {
            finalColumnDefinition[i] = selected;
        }

    }
    return finalColumnDefinition;
}

/**
 * Returns meta data about menus to be used to fetch actual listing data
 * This method is invoked, Once menu detail is fetched 
 * @param  {object} menuDetail
 */
export function ConvertMenuDetailForGenericPage(menuDetail) {
    if (menuDetail.order_definition) {
        var splits = menuDetail.order_definition.split(",");
    }

    let layouts = menuDetail.list_layouts || menuDetail.layouts;
    menuDetail.layouts = GetParsedLayoutScript(layouts);

    const layout = layouts.length ? layouts[0] : null; // @TODO for now taking 0th element as default layout, change later 
    // menuDetail.layouts = menuDetail.layouts.filter(layout => layout && layout.name && layout.query && layout.name != 'default');

    delete menuDetail.list_layouts;

    if (layout) {
        layout.column_definition = layout.column_definition;
    }

    /**
     * Preparing obj to build template
     */
    return {
        includes: menuDetail.includes,
        // url: menuDetail.base_url,
        url: menuDetail.route,
        restricted_query: menuDetail.restricted_query,
        restrictColumnFilter: menuDetail.restricted_column,
        order: menuDetail.order_definition ? splits[0].trim() : "id",
        sort: menuDetail.order_definition ? splits[1].trim() : "desc",
        menuId: menuDetail.id,
        layouts: menuDetail.layouts,
        form_layouts: menuDetail.form_layouts,
        layout,
        pageName: menuDetail.name,
        image: menuDetail.image,
        uiActions: menuDetail.ui_actions
        // starter: menuDetail.starter,
        // userMethod: menuDetail.method,
        // formPreferenceName: menuDetail.state_name.toLowerCase(),
        // model: menuDetail.data_model,
        // preference: menuDetail.preference,
        // listName: menuDetail.state_name.toLowerCase(),
        // nextActions: menuDetail.actions,
        // userFilter: menuDetail.user_filter,

        // stateName: menuDetail.state_name,
        // module: menuDetail.base_url,
        // search: menuDetail.search,
        // actions: menuDetail.actions,
        // method: menuDetail.method,
        // scripts: menuDetail.scripts,
    };
}


export function CreateInclusions(includes) {
    const arr = [];
    let starter = "";
    includes = includes.split(",");
    for (const k in includes) {
        const inclusions = includes[k].split(".");
        for (const i in inclusions) {
            const name = parseInt(i) ? starter + "." + inclusions[i] : inclusions[i];
            starter = name;
            if (arr.indexOf(name) == -1) {
                arr.push(name);
            }
        }
    }

    return arr.join(",");
}


/**
 * parse url string to actual one
 * this method seek for ':', whenever it encounters one, replace with actual data
 * for e.g. booking/:id is converted to booking/12
 * @param  {string} url='' 
 * @param  {object} obj
 */
export function CreateUrl({ url = '', obj }) {
    const reg = /(:)\w+/g;
    const params = url.match(reg);
    if (!(params && params.length)) {
        return url;
    }
    for (let i in params) {
        const attr = params[i].substr(1);
        url = url.replace(params[i], obj[attr]);
    }
    return url;
}

// export function ConvertDependencyInjectionToArgs(dependencies) {
//     if (!dependencies) {
//         return [];
//     }

//     var args = [];
//     var dependency = dependencies.split(",");
//     for (var i in dependency) {
//         args.push('this.' + eval(dependency[i]));
//     }

//     return args;
// }

/**
 * Register all the methods coming from db
 * takes string as method definition, and corresponding dependencies, register them and pass object of all methods
 * @param  {} methodArr
 */
export function RegisterMethod(methodArr) {
    const methods = {};
    for (var i in methodArr) {

        const methodObj = methodArr[i];

        if (!methodObj) {
            return;
        }
        if (methodObj.definition && typeof methodObj.definition == 'object' && methodObj.definition.script) {
            if (methodObj.dependency) {
                methods[methodObj.name] = new Function("callback", methodObj.dependency, methodObj.definition.script);
            } else {
                methods[methodObj.name] = new Function("callback", methodObj.definition.script);
            }
        }
    }
    return methods;
}

/**
 * Returns predefined methods used by CustomAction component 
 * methods includes redirect, add, edit, delete, auditLog
 */
export function GetPreSelectedMethods() {
    const methods = {};
    let menuDetail = null;
    let menuDictionary = null;
    let menuColumns = null;

    // methods.preferenceSetting = (preference, preferenceObj) => {
    //     ModalManager.openModal({
    //         headerText: "Edit " + preferenceObj.name + " Preference",
    //         modalBody: () => (<PreferenceSetting listing={preference} preferenceObj={preferenceObj}></PreferenceSetting>)
    //     })
    // }


    methods.redirectGeneric = ({ action, listingRow, history, genericData }) => {
        let url = CreateUrl({ url: action.parameter, obj: listingRow });
        // var urlParams;
        // var userQuery = 0;

        url = createQueryUrl(url, genericData.restrictQuery, genericData);
        // history.push(url);
        Location.navigate({ url });
        // if (angular.isDefined(event)) {
        //     if (event.metaKey || event.ctrlKey) {
        //         window.open("#/" + url, "_blank");
        //     } else {
        // $location.url(url);
        // location.hash = "#/" + url;
        //     }
        // }
    };

    /**
     * To be used to edit menu directly from generic detail page
     */
    methods.editMenu = async (menuId) => {

        const options = {
            dictionary: menuDictionary ? false : true
        };

        const url = 'menu';
        const builtUrl = BuildUrlForGetCall(url + '/' + menuId, options);
        const res = await Get({ url: builtUrl });

        menuDictionary = res.dictionary || menuDictionary;
        menuDetail = res.response;

        const params = {
            dictionary: menuDictionary, includes: "", starter: url
        };
        if (!menuColumns) {
            menuColumns = GetColumnsForListing(params);
        }
        // FormFactory.createFormObj(vm.tabs.callFunction, menuColumns, null, params.starter + ".form", "menu", "edit", menuDetail, null, condition, null, menuScripts, vm.genericDetailObject.model);

        const genericData = {
            columns: menuColumns,
            // module: url
            url
        };
        methods.editGeneric({ listingRow: menuDetail, genericData });
    };

    /**
     * Generic add method
     * @param  {object} {action
     * @param  {object} listingRow
     * @param  {object} genericData}
     */
    methods.addGeneric = ({ action, listingRow, genericData, source = 'module', menuDetail, parent }) => {
        const formContent = GetFormContent({ listingRow, action, genericData, source, method: 'Add', menuDetail, parent });
        ProcessForm({ formContent });
        // const formContent = {
        //     source,
        //     callback: action.callback,
        //     data: listingRow,
        //     starter: genericData.starter,
        //     dictionary: genericData.columns,
        //     relationship: genericData.model,
        //     layout: genericData.formPreference,
        //     userId: genericData.userId,
        //     modelId: genericData.modelId,
        //     route: genericData.url,
        //     name: 'Add' + genericData.starter,
        // };

    }

    /**
     * Generic edit method
     * @param  {object} {action
     * @param  {object} listingRow
     * @param  {object} genericData}
     */
    methods.editGeneric = ({ action, listingRow, genericData, source = 'model', menuDetail, parent }) => {
        const formContent = GetFormContent({ listingRow, action, genericData, source, method: 'Edit', menuDetail, parent });
        ProcessForm({ formContent });
        // const payload = { method: 'edit', action, listingRow, columns: genericData.columns, formPreference: genericData.formPreference, modelName: genericData.modelName, module: genericData.module };
        // const formContent = {
        //     source,
        //     method: 'edit',
        //     callback: action.callback,
        //     data: listingRow,
        //     starter: genericData.starter,
        //     dictionary: genericData.columns,
        //     relationship: genericData.model,
        //     layout: genericData.formPreference,
        //     userId: genericData.userId,
        //     modelId: genericData.modelId,
        //     route: genericData.url,
        //     name: 'Edit' + genericData.starter
        //     // columns: genericData.columns,
        //     // formPreference: genericData.formPreference,
        //     // modelName: genericData.modelName,
        //     // module: genericData.module,
        //     // dataModel: genericData.dataModel,
        //     // action,
        //     // url: genericData.url
        // };

    }

    methods.customForm = ({ action, listingRow, genericData, source = 'form', menuDetail, parent }) => {
        const formContent = GetFormContent({ listingRow, action, genericData, source, method: 'Add', menuDetail, parent });
        formContent.form = action;
        ProcessForm({ formContent, isForm: true });
    }

    /**
     * Passes entire listing row object which is used to prepopulate input fields
     * short cut for adding new record
     * @param  {object} {action
     * @param  {object} listingRow
     * @param  {object} genericData}
     */
    methods.copyGeneric = ({ action, listingRow, genericData, source = 'module', menuDetail, parent }) => {
        const formContent = GetFormContent({ listingRow, action, genericData, source, method: 'Add', menuDetail, parent });
        ProcessForm({ formContent });
        // const formContent = {
        //     source,
        //     method: 'add',
        //     callback: action.callback,
        //     data: listingRow,
        //     starter: genericData.starter,
        //     dictionary: genericData.columns,
        //     relationship: genericData.model,
        //     layout: genericData.formPreference,
        //     userId: genericData.userId,
        //     modelId: genericData.modelId,
        //     route: genericData.url,
        //     name: 'Add' + genericData.starter
        // };
    }

    methods.deleteGeneric = async ({ action, listingRow, genericData }) => {
        const deletekey = IsUndefinedOrNull(action.redirectValueName) ? listingRow.id : listingRow[action.redirectValueName];

        const method = async () => {
            const result = await Delete({ url: `${genericData.url}/${deletekey}`, urlPrefix: ROUTE_URL });
            if (result.success) {
                action.callback();
                ToastNotifications.success({ title: 'Records has been deleted' });
            }
        }

        ConfirmUtils.confirmModal({ message: "Are you sure you want to delete this record?", callback: method });

        // if (window.confirm('Are you sure you want to delete this record?')) {
        //     const result = await Delete({ url: `${genericData.module}/${deletekey}` });
        //     if (result.success) {
        //         action.callback();
        //         ToastNotifications.success('Records has been deleted');
        //     }
        // }
    }

    // auditLog
    methods.auditGeneric = async ({ action, listingRow, genericData }) => {
        const result = await Get({ url: "auditLog?" + "model=" + genericData.model.id + "&id=" + listingRow.id + "&includes=created_user&dictionary=true&order=created_at,desc&limit=150" });
        if (result.success) {
            const auditData = result.response.response;
            let columns = {
                auditData: [{
                    field: "parameter",
                    label: "Parameter"
                }, {
                    field: "old_value",
                    label: "Old Value"
                }, {
                    field: "new_value",
                    label: "New Value"
                }, {
                    field: "created_at",
                    label: "Creation Time"
                }, {
                    field: "created_user.display_name",
                    label: "Created By"
                }]
            }
            ModalManager.openModal({
                headerText: 'Audit Log',
                modalBody: () => (<TableWrapper listing={auditData} columns={columns.auditData}></TableWrapper>)
            })
        }
    }

    return methods;
}

export function GetFormContent({ listingRow, action, genericData, source, method = '', menuDetail = {}, parent = {} }) {
    return {
        method: method.toLowerCase(),
        menu: menuDetail,
        source,
        parent: parent,
        callback: action.callback,
        data: listingRow,
        starter: genericData.starter,
        dictionary: genericData.columns,
        relationship: genericData.model,
        layout: genericData.formPreference,
        layouts: genericData.formPreferences,
        userId: genericData.userId,
        modelId: genericData.modelId,
        modelAliasId: genericData.modelAliasId,
        route: genericData.url,
        name: method + ' ' + genericData.starter,
        modelHash: genericData.modelHash
    };
}

export async function GetPreference(paramName) {
    const res = await Get({ url: 'userPreference?parameter=' + paramName });
    if (res.success) {
        try {
            return JSON.parse(res.response.value);
        } catch (e) {
            console.error('Something went wrong while parsing JSON');
            console.log(res.response.value);
            return {};
        }
    }

}

/**
 * Will return value for all kind of columns
 * @param  {object} {selectedColumn - dictionary object
 * @param  {object} listingRow - data value
 * @param  {string} path='path'}
 */
export function RowTemplate({ selectedColumn, listingRow, path = 'path' }) {
    if (selectedColumn.column_type_id == COLUMN_TYPE.BOOLEAN) {
        // return eval('listingRow.' + selectedColumn.path) ? 'Yes' : 'No';
        return listingRow[selectedColumn.path] ? <div className="green">Yes</div> : <div className="red">No</div>;
    } else if (selectedColumn.route && selectedColumn.menu_url) {
        // const id = listingRow[selectedColumn.p]
        const idPath = selectedColumn.parent + '.id';
        const path = `${selectedColumn.menu_url}/${listingRow[idPath]}`
        return <a className='hyperlink-field' onClick={(e) => Location.navigate({ url: path }, e)}>
            {defaultRowValue({ listingRow, selectedColumn, path })}
        </a>
    } else {
        return defaultRowValue({ listingRow, selectedColumn, path });
    }
}

function defaultRowValue({ listingRow, selectedColumn, path }) {
    try {
        return <ParseComponent listingRow={listingRow} data={listingRow[selectedColumn.path]} filter={selectedColumn.filter} />;
        // return eval('listingRow.' + selectedColumn[path]);
    } catch (e) {
        return '';
    }

}

function convertIt(str) {
    return str.replace(/.([^.]*)$/, "");
}

function createQueryUrl(url, restrictQuery, genericData) {

    var query = '';
    var orderMethod;

    // If query is present 
    // we add it ,
    // else we check if there is a filter in the url , 
    // then append the respective filter query 
    // if (urlParams.query) {
    //     query += urlParams.query;
    // } else {
    //     if (urlParams.filter) {
    //         var filter = this.props.genericData.userFilter.filter(function (userFilter) {
    //             return userFilter.id == urlParams.filter;
    //         })[0];
    //         query += filter.filter_query;
    //     }
    // }

    if (restrictQuery) {
        if (query) {
            query += restrictQuery;
        } else {
            query += restrictQuery.split('and ')[1];
        }
    }

    if (query) {
        query = '?redirectQuery=' + query;
        orderMethod = '&';
    } else {
        orderMethod = '?';
    }
    // if (urlParams.order) {
    //     url += query + orderMethod + "listingOrder=" + urlParams.order + ',' + (urlParams.sort || 'desc');
    // } else if (this.props.genericData.defaultOrder) {
    //     url += query + orderMethod + "listingOrder=" + this.props.genericData.defaultOrder;
    // } else {
    //     url += query;
    // }

    return url;
}

/**
 * Returns url for api call
 * being used in formCreator to detemine the url based on the method
 * @param  {object} payload
 */
export function GetUrlForFormCreator({ payload, getDictionary = false, isForm }) {
    let url = '';
    if (payload.source == 'form' || isForm) {
        url = `${FormDetailEndPoint}/${payload.form.form_id}`;
        return url;
    }

    // @TODO @shubham remove below line after sometime - shubham
    url = payload.method == 'edit' ? payload.route + '/' + (payload.data.id || payload.data[payload.starter + '.id']) : payload.route;

    if (getDictionary) {
        return url + (payload.method == 'edit' ? '/edit' : '/create');
    }
    return url;
}

export function GetUrlForFormSubmit({ payload }) {
    let url = '';
    const isForm = payload.source == 'form' ? true : false;
    if (isForm) {
        // get url
        url = ConvertToQuery.bind({ data: payload.data, record: payload.record })(payload.route);
        return url;
    }
    url = payload.method == 'edit' ? payload.route + '/' + (payload.data.id || payload.data[payload.starter + '.id']) : payload.route;

    return url;
}

export function GetSelectedColumnDefinition(layout) {
    const selectedColumnsDefinition = (layout && typeof layout == 'object') ? layout.column_definition : null;

    if (typeof selectedColumnsDefinition == 'string') {
        return JSON.parse(selectedColumnsDefinition);
    }
}

export function RemoveStarterFromThePath({ data, starter }) {
    const obj = {}
    for (let i in data) {
        const index = i.replace(starter + '.', '');
        obj[index] = data[i];
    }
    return obj;
}

export function GetParsedLayoutScript(listLayouts) {
    if (!Array.isArray(listLayouts)) {
        return [];
    }
    return listLayouts.map(layout => {
        // menuDetail.layouts = menuDetail.list_layouts.map(layout => {
        try {
            layout.column_definition = typeof layout.column_definition == 'string' ? JSON.parse(layout.column_definition) : layout.column_definition;

        } catch (e) {
            layout.column_definition = {};
        }
        return layout;
    })

}

export function GetChangedMethods(newValues, originalValues = {}) {
    const data = {};
    if (!IsObjectHaveKeys(originalValues)) {
        return newValues;
    }
    if (IsObjectHaveKeys(newValues)) {
        for (let i in newValues) {
            const newValue = newValues[i];
            const oldValue = originalValues[i];
            if (newValue != oldValue) {
                data[i] = newValue;
            }
        }
    }

    return data;
}

export function ParseRestrictedQuery(queryString) {
    // const currentUser = GetUser();
    // if (queryString.includes(":currentUser") && currentUser.id) {
    //     queryString = queryString.replace(/:currentUser.id/g, currentUser.id);
    // }

    const parsedQuery = [];
    if (!queryString) {
        return parsedQuery;
    }
    let queries = queryString.split(' and ');
    queries.forEach(orQuery => {

        orQuery = orQuery.replace(MATCH_START_END_PARANTHESIS, '');
        const queryArr = orQuery.split(' or ');
        queryArr.forEach(query => {
            if (!query) {
                return;
            }

            query = query.replace(MATCH_PARENT_PATH, '').replace(MATCH_WHITESPACE, '');
            query = query.split('=');
            let value = query[1];

            if (typeof value == 'string') {
                value = value.replace(/'/g, '');
            }
            parsedQuery[query[0]] = value;
            // parsedQuery.push(query)

        });
    })

    return parsedQuery;
}

/**
 * Returns path including parent and column name having parent wrapped within '`'
 * @param  {Object} column  
 */
export function GetPathWithParent(column) {
    // if (column.path.split('.').length > 2) {
    return `\`${column.parent}\`.${column.referenced_column ? column.referenced_column : column.name}`;
}

/**
 * evaluates condition and return boolean value accordingly
 * @param  {string} condition
 * @param  {object} itemRow
 */
export function EvalCondtionForNextActions(condition, itemRow, starter) {
    if (!condition) {
        return true;
    }
    let data = { ...itemRow };

    if (starter) {
        data = RemoveStarterFromThePath({ data: itemRow, starter });
    }

    var reg = /:[\w.]*/g;
    var expressions = [];
    var evaluatedExpressions = [];
    expressions = condition.match(reg);

    const pathSample = Object.keys(data)[0];

    for (var i in expressions) {
        var expression = expressions[i].split(":")[1];
        // added try catch for checking conditions of menu action
        try {
            // const isSingleLevel = IsObjectSingleLevel(data);
            const isSingleLevel = expression.split('.').length > 1 ? false : true;
            if (isSingleLevel) {
                evaluatedExpressions[i] = eval(data[expression]);
            } else {
                evaluatedExpressions[i] = eval(`data.${expression}`);
            }

            if (evaluatedExpressions[i] instanceof Array) {
                if (evaluatedExpressions[i].length) {
                    evaluatedExpressions[i] = 1;
                } else {
                    evaluatedExpressions[i] = 0;
                }
            }

            evaluatedExpressions[i] = typeof evaluatedExpressions[i] == 'string' ? `'${evaluatedExpressions[i]}'` : evaluatedExpressions[i];
            condition = condition.replace(expressions[i], evaluatedExpressions[i] && typeof evaluatedExpressions[i] == 'object' ? 1 : evaluatedExpressions[i]);
        } catch (e) {
            console.log(e.message);
            evaluatedExpressions[i] = data[expression];
            condition = condition.replace(expressions[i], "'" + evaluatedExpressions[i] + "'");
        }
    }
    try {
        return eval(condition);
    } catch (e) {
        console.warn('Error in filter condition, Please check script');
        console.warn('Executed script ->', e);
        console.error(e);
    }
};

/**
 * Evaluates value against url
 * @param  {} url
 */
export function CreateUrlForFetchingDetailRecords({ url, urlParameter }) {
    if (!url) {
        return false;
    }
    var reg = /([:$])\w+/g;
    var params = url.match(reg);
    if (!params || !params.length) {
        return url;
    }
    for (var i in params) {
        // url = url.replace(params[i], $stateParams[params[i].split(":")[1]]);
        const key = params[i];

        url = url.replace(key, urlParameter[key.substr(1)]);
    }
    return url;
}

/**
 * Filters out same kind of actions on the basis of their identifier
 * in the event of same identifier, action having higher id gets preference
 * @param  {array} actions
 */
export function FilterOutDuplicateActions(actions) {
    const obj = {};
    const finalActions = [...actions];
    const duplicateIndices = [];
    if (!Array.isArray(actions)) {
        return [];
    }
    actions.forEach((action, index) => {
        const identifier = action.identifier;
        if (obj[identifier]) {
            const duplicateIndex = obj[identifier].id > action.id ? index : obj[identifier].index;
            duplicateIndices.push(duplicateIndex);
        } else {
            obj[identifier] = { ...action, ...{ index } };
        }
    });

    duplicateIndices.forEach(index => finalActions.splice(index, 1));
    return finalActions;
}

/**
 * detects if object have only single level of attribute
 * for e.g. data object from generic apis return single level object so method return true for those object
 */
function IsObjectSingleLevel(object) {
    let isSingleLevel = false;
    if (!(object && typeof object == 'object')) {
        return isSingleLevel;
    }

    const pathSample = Object.keys(object)[0];
    if (typeof pathSample != 'string') {
        return isSingleLevel;
    }

    isSingleLevel = pathSample.split('.').length > 1 ? false : true;
    return isSingleLevel;
}
