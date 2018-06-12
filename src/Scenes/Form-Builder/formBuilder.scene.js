import React, { Component } from 'react';
import FormGenerator from './../../Components/Form-Generator/formGenerator.component';
import { Get } from './../../Utils/http.utils';

import { SelectFromOptions } from './../../Utils/common.utils';
import { GetLookupValues } from './../../Utils/lookup.utils';


const inputTypes = [
    {
        formElements: {
            label: '',
            field: '',
            key: 'id',
            scope: '',
            display_column: 'name',
            onSelect: ''
        },
        type: 'input'
    }
];
export default class FormBuilder extends Component {

    fields = inputTypes[0];

    constructor(props) {
        super(props);

        this.state = {
            formOutput: {},
            fields: [],
            columns: {},
            inputSubTypes: []
        };
    }

    componentDidMount() {
        this.getForm();
        this.getLookups();
    }

    getForm = async () => {
        const { fields } = this.state;
        const { formId } = this.props.match.params;
        const url = 'formDetail/' + formId;
        const result = await Get({ url });

        if (result.success) {
            const formOutput = result.response;
            console.log(formOutput);
            this.setState({ formOutput });
            formOutput.fields = JSON.parse(formOutput.fields);

            formOutput.fields.forEach((formElement) => {
                if (typeof formElement == 'object') {
                    // Build fields with the template 
                    fields.push(this.getFormElement(formElement));
                    this.setState({ fields })
                } else {
                    fields.push(formElement);
                    this.setState({ fields })
                }
            });
        }
    }

    getLookups = async () => {
        const { columns } = this.state;
        const result = await GetLookupValues(31);
        if (result.success) {
            const inputSubTypes = result.response;
            inputSubTypes.forEach((inputType) => {
                columns[inputType.id] = Object.assign(inputType, {
                    column_type: inputType.id
                });
            });
            this.setState({inputSubTypes});
        }

    }

    getFormElement(form) {
        const { inputSubTypes } = this.state;
        return {
            formElements: {
                type: SelectFromOptions(inputSubTypes, form.column_type, 'column_type'),

                display_name: form.columnTitle || form.display_name, // for now sending column title in case of fallback , but this wont be required , 
                column_name: form.field || form.column_name,

                // Display column and Route are only for reference models
                route: form.route,
                display_column: form.display_column,
                key: form.key,
                onSelect: form.onSelect,
                scope: form.scope
            },
            type: 'input',
        };
    }

    formCreated = (form) => {
        console.log(form);
    }

    render() {
        const { formOutput, fields, inputSubTypes } = this.state;
        return (
            formOutput.id && inputSubTypes ? <FormGenerator inputSubTypes={inputSubTypes} formOutput={formOutput} fields={fields} onSubmit={this.formCreated()} /> : null
        )
    }
}