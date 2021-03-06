import React, { Component } from 'react';
import {
    Card, Button
} from 'reactstrap';

import { Get } from 'common-js-util';

import './userLicenseCard.component.css';
import classNames from 'classnames';
import ImageViewer from './../../Components/Image-Viewer/imageViewer.component.js';

import 'react-viewer/dist/index.css';
import './userLicenseCard.component.css';
import 'react-viewer/dist/index.css';

export default class UserLicenseCard extends Component {
    container = HTMLDivElement;
    constructor(props) {
        super(props);
        this.state = {
            mode: 'inline',
            userData: props.userData,
            flag: props.flag,
            sample: props.sample,
            acceptL: props.acceptL,
            deleteL: props.deleteL,
            rejectL: props.rejectL,
            promoWallet: 0,
            cashWallet: 0,
            visible: true,
            activeIndex: 0,
            userLicenseImage: props.userLicenseImage
            // container:undefined
            // container:{}
        };
    }

    componentDidMount() {
        this.walletAmount();
    }

    walletAmount = async () => {
        const { userData } = this.state;

        const url = 'wallet?user=' + userData.id
        const result = await Get({ url });
        if (result.success) {
            const promoWallet = result.response.nonRewardAmount;
            const cashWallet = result.response.rewardAmount;
            this.setState({ promoWallet, cashWallet })
        }
    }



    render() {
        const { userData = {}, promoWallet, cashWallet, userLicenseImage, flag } = this.state;
        // sample = this.props.sample();
        let userLicenseImageArr = [];

        //.filter((image) => image.approved == 1)

        userLicenseImageArr = userData.licenses.map((image) => {
            // if (image.approved == 1) {
            image.src = image.license;

            return image;
            // }
        })

        // userData.licenses.forEach(function (checkApprovedLicense) {
        //     if (checkApprovedLicense.approved == 1) {
        //         return userLicenseImage.push(checkApprovedLicense);
        //     }
        // });

        let inline = this.state.mode === 'inline';

        let inlineContainerClass = classNames('inline-container', {
            show: this.state.visible && inline,
        });

        { userLicenseImageArr.map((value, key) => value.image = value.license) }
        
        return (
            <Card className="user-license-card">
                <div className="user-license-photo">

                    {
                        userLicenseImageArr.length > 0 ?
                            // <div>
                            <div className={inlineContainerClass} ref={ref => { this.state.container = ref; }}>

                                {/* <BewViewer images={userLicenseImage}/> */}

                                {/* <Viewer
                                        container={this.state.container}
                                        visible={this.state.visible}
                                        images={userLicenseImage}
                                        activeIndex={this.state.activeIndex}
                                        noClose={true}
                                        zoomable={false}
                                    /> */}
                                {/* <div> */}

                                <ImageViewer images={userLicenseImageArr} />
                                {/* </div> */}
                                {/* <i className="fa fa-plus"></i> */}


                                <div>

                                    {flag ?
                                        <div>

                                            <Button className="accept" onClick={() => this.props.acceptL()}>Accept License</Button>
                                            <Button className="reject" onClick={() => this.props.rejectL()}>Rejected License</Button>
                                            <Button className="delete" onClick={() => this.props.deleteL()}>Delete License</Button>
                                        </div>
                                        :
                                        null
                                    }
                                </div>

                            </div>
                            // </div>
                            : <img className='dummy-license' src={require('./../../Assets/images/Dummy-License.jpg')} alt="" />
                    }
                </div>
                <div className="user-license-data">
                    <div className="text-field">
                        Licence No.
                    </div>

                    <div className="data-field">
                        {
                            (userData.license_number) ?
                                <div className="licence-number-verified"><i className="fa fa-check-circle"></i>{userData.license_number}</div>
                                : <div className="licence-number-not-verified"><i className="fa fa-times"></i>Not verified </div>
                        }

                    </div>
                </div>
            </Card >
        )
    }
}
