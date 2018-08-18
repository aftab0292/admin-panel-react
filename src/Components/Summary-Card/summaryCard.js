import React, { Component } from 'react';
import { Card, Row, Col, Collapse, Button, CardBody } from 'reactstrap';
import './../../Components/Booking/Components/Booking-Ride-Return/bookingRideReturn.component';
import { TruncateDecimal } from './../../Utils/js.utils';
import './summaryCard.css';

let tentative_amount=0;
let paidAmount=0;

export default class SummaryCard extends Component {

    constructor(props) {
        super(props);
        this.toggle = this.toggle.bind(this);
        this.state = {
            bookingData: props.bookingData,
            collapse: false

        };
    }

    toggle() {
        this.setState({ collapse: !this.state.collapse });
    }

    getBookingData = (bookingData) => {
        tentative_amount = bookingData.tentative_amount;
        if (bookingData.booking_payment && bookingData.booking_payment.length) {
            bookingData.booking_payment.forEach(function (data) {
                paidAmount += parseFloat(data.amount);
            });
        }

        let fairAmount = 0;
        if (bookingData.collection && bookingData.collection.length) {
            bookingData.collection.forEach(function (data) {
                fairAmount += parseFloat(data.amount);
            });
        }

        if (bookingData.extension && bookingData.extension.length) {
            let approvedExtensionCost = 0;
            bookingData.extension.forEach(function (data) {
                if (data.approved == 1 && !data.deleted_at) {
                    approvedExtensionCost += parseFloat(data.cost);
                }
            });
            if (approvedExtensionCost > 0) {
                bookingData.tentative_amount += approvedExtensionCost
            }
        }

        let amountDue = 0;
        bookingData.refund.forEach(function (remaining_amount) {
            if (remaining_amount.processed == 0) {
                amountDue += parseFloat(remaining_amount.amount);
            }
        });

        return (
            <Card className="summary-card">
                <div className="summary-card-heading">
                    Summary
                </div>

                <div className="summary-card-body">
                    <div className="row-1">

                        <div className="class">

                            <div className="title">
                                Amount Paid
                            </div>

                            <div className="data">
                                ₹{paidAmount}
                            </div>
                        </div>

                        {
                            (bookingData.status.id == 5 || bookingData.status.id == 6) ?

                                <div className="class">

                                    <div className="title">
                                        Tentative Amount
                                    </div>

                                    <div className="data">
                                        ₹{bookingData.tentative_amount}
                                    </div>
                                </div>

                                : null
                        }

                        {
                            (bookingData.status.id == 7 || bookingData.status.id == 8) ?

                                <div className="class">

                                    <div className="title">
                                        Total Fair
                                    </div>

                                    <div className="data">
                                        ₹{fairAmount}
                                    </div>
                                </div>

                                : null
                        }

                        {
                            (bookingData && bookingData.type.id != 580 && amountDue < 0 && bookingData.status.id != 5 && bookingData.status.id != 6) &&

                            <div className="class">

                                {
                                    amountDue < 0 && <div className="title">
                                        Amount Due
                                    </div>
                                }

                                {
                                    amountDue < 0 ? <div className="data">
                                        ₹{0 - amountDue}
                                    </div>
                                        : null
                                }
                            </div>


                        }


                        {
                            (bookingData && amountDue > 0 && bookingData.status.id != 5 && bookingData.status.id != 6) &&

                            <div className="class">

                                <div className="title">
                                    Refund
                                    </div>

                                <div className="data">
                                    ₹{amountDue}
                                </div>
                            </div>


                        }

                    </div>
                </div>


                <div className="pricing-object">
                    <div>
                        <div className="pricing" onClick={this.toggle}  >
                            Pricing Object<i className={"fa " + (this.state.collapse ? 'fa-caret-up' : 'fa-caret-down')}></i>
                        </div>
                        <Collapse isOpen={this.state.collapse}>
                            <Card className="card-body">
                                <CardBody>
                                    {
                                        Object.keys(bookingData.pricing_object).map(key => {
                                            const pricing = bookingData.pricing_object[key];
                                            key = key.replace( /_/g, " ");
                                            if (key == 'city') {
                                                return;
                                            }
                                            else if (key == 'peak'){
                                                return (
                                                    <Row className="card-object" key={key}>
                                                        <Col className="item">{key}</Col>
                                                        <Col className="value">{pricing ? 'True' : 'False'}</Col>
                                                    </Row>
                                                )
                                            }
                                            else{
                                                return (
                                                    <Row className="card-object" key={key}>
                                                        <Col className="item">{key}</Col>
                                                        <Col className="value">{pricing.toFixed ? pricing.toFixed(2): pricing}</Col>
                                                    </Row>
                                                )
                                            }
                                        })
                                    }
                                </CardBody>
                            </Card>
                        </Collapse>
                    </div>
                </div>
            </Card>
        )
    }

}