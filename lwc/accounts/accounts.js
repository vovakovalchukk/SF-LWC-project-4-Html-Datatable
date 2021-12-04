import { LightningElement, track, wire } from 'lwc';

import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { updateRecord } from 'lightning/uiRecordApi';
import { deleteRecord } from 'lightning/uiRecordApi';

import getAccounts from '@salesforce/apex/AccountController.getAccounts';

export default class Accounts extends LightningElement {
    @track draftValues = [];
    @track accounts;
    @track error;

    lastSavedData = [];
    showFooter = false;

    wiredAccountResult;

    @wire(getAccounts)
    imperativeWiring(result) {
        this.wiredAccountResult = result;
        const { data, error } = result;
        if(data) {
            this.accounts = data.map(function(item, index) {
                return {
                    'Id' : item.Id,
                    'Name' : item.Name,
                    'Rating' : item.Rating,
                    'Index' : index + 1,
                    'controlEditName' : true,
                    'controlEditRating' : true,
                }
            });
            this.lastSavedData = this.accounts;
        } else if (error) {
            this.error = error;
        }
    }

    onDraftValueChanged(event) {
        let dataRecieved = event.detail.data;
        let updatedItem = { Id: dataRecieved.Id, Name: dataRecieved.Name, Rating: dataRecieved.Rating};
        this.draftValues = updatedItem;
        this.toBlockEditButtons();
        this.showFooter = true;
    }

    toBlockEditButtons() {
        this.accounts = this.accounts.map(function(item) {
            return {
                ...item,
                'controlEditName' : false,
                'controlEditRating' : false,
            }
        });
    }

    toUnblockEditButtons() {
        this.accounts = this.accounts.map(function(item) {
            return {
                ...item,
                'controlEditName' : true,
                'controlEditRating' : true,
            }
        });
    }

    onSave() {
        const fields = {}; 
        fields['Id'] = this.draftValues.Id;
        fields['Name'] = this.draftValues.Name;
        fields['Rating'] = this.draftValues.Rating;
        const recordInput = {fields};

        updateRecord(recordInput)
        .then(() => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Account updated',
                    variant: 'success'
                })
            );
            return refreshApex(this.wiredAccountResult).then(() => {
                this.draftValues = [];
                this.showFooter = false;
                this.toUnblockEditButtons();
                this.resetRowData();
            });
        }).catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error updating or reloading record',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        });

        this.lastSavedData = this.accounts;
    }

    onCancel() {
        this.accounts = this.lastSavedData;
        this.draftValues = [];
        this.showFooter = false;
        this.toUnblockEditButtons();
        this.resetRowData();
    }

    onDelete(event) {
        const recordId = event.detail.data.Id;
            deleteRecord(recordId)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Account deleted',
                        variant: 'success'
                    })
                );
                refreshApex(this.wiredAccountResult);
                this.showFooter = false;
                this.resetRowData();
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error deleting record',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            })    
    }

    resetRowData() {
        this.template.querySelectorAll("c-row").forEach(function(userItem) {
            userItem.resetData();
        });
    }
}