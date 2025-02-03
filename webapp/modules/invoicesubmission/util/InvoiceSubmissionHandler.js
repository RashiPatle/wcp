sap.ui.define([
	"com/westernacher/collaborationPortal/core/util/ParentModuleHandler",
	"sap/m/MessageBox",
	"com/westernacher/collaborationPortal/core/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/type/Currency"
], function (ParentModuleHandler, MessageBox, formatter, Filter, FilterOperator, DateFormat, Currency) {
	"use strict";

	return ParentModuleHandler.extend("com.westernacher.collaborationPortal.invoicesubmission.util.InvoiceSubmissionHandler", {
		dateFormatter: DateFormat.getDateInstance({
			pattern: "LLL dd, yyyy",
			UTC: false
		}),

		dateFormatterUTC: DateFormat.getDateInstance({
			pattern: "LLL dd, yyyy",
			UTC: true
		}),

		constructor: function (oComponent) {
			this._oComponent = oComponent;
			this._oModel = oComponent.getModel();
			this._i18nHomeModel = oComponent.getModel("i18nhome");
			this._oCIModel = oComponent.getModel("_CI"); //CreateInvoice 
			this._oDVModel = oComponent.getModel("_DV");
			this._oMDModel = oComponent.getModel("_MD");
			this._MD = oComponent._MD;

			this._oCIModel.setProperty("/FreightOrders", []);
			this.sInvoicesEntitySet = "ZWCP_C_SETLCarrierInvoices";
			this.i18n = oComponent.getModel("i18n");
			this.updateFOQuantitiesDialogId = "idUpdateFOQuantitiesInvoicecSubmissionDialog";
			this.updateInvoiceDialogId = "idUpdateInvoiceDialog";
			this.addChargeDialogId = "idAddChargeInvoicecSubmissionDialog";
			this.addTaxDialogId = "idAddTaxInvoicecSubmissionDialog";
			this.updateChargeDialogId = "idUpdateChargeInvoicecSubmissionDialog";
		},

		formattingAmountsInLocale: function (oEvent) {
			//formatter.convertPriceInLocale(oEvent);
			formatter.convertPriceInLocaleFormat(oEvent);
		},

		ValidatingAmountsInLocale: function (oEvent) {
			formatter.validatePriceInLocale(oEvent);
		},

		_prepareChargeAndTaxTypes: function (aFreightOrders) {
			//preparing filters for charge type call
			var oChargeTypeFilter = new Filter({
				filters: [
					new Filter({
						path: "Carrier",
						operator: FilterOperator.EQ,
						value1: aFreightOrders[0].Carrier
					}),
					new Filter({
						path: "TransportationMode",
						operator: FilterOperator.EQ,
						value1: aFreightOrders[0].TransportationMode
					})
				],
				and: true
			});
			//fetching charge & tax types
			this.callEntitySetDataLoad("ChargeTypes", "AllChargeTypeCodes", this.getModel(), [oChargeTypeFilter], "to_ChargesUoM", this._getChargeAndTaxTypes
				.bind(this));
		},

		/* overriding function MsterData.js ~ callEntitySetDataLoad
		 */
		callEntitySetDataLoad: function (sEntitySetName, sPropertyName, oModel, aFilters, sExpandProperty, fnCallBack) {
			if (!sEntitySetName) {
				return;
			}

			var aFilterFinal = aFilters ? aFilters : null;
			var sExpandProperty = sExpandProperty ? sExpandProperty : null;

			if (!this._oComponent.getModel("_MD").getProperty("/" + sEntitySetName + "Loaded")) {
				if (!oModel) {
					oModel = this.getModel();
				}
				oModel.read("/" + sEntitySetName, {
					filters: aFilterFinal,
					urlParameters: {
						"$expand": sExpandProperty
					},
					success: function (oData, oResponse) {
						var sProperty = sPropertyName ? sPropertyName : sEntitySetName;
						this._oComponent.getModel("_MD").setProperty("/" + sProperty, oData.results);
						this._oComponent.getModel("_MD").setProperty("/" + sEntitySetName + "Loaded", true);
						if (fnCallBack) {
							fnCallBack();
						}
					}.bind(this),
					error: function (oErr) {

					}
				});
			}
		},

		_getChargeAndTaxTypes: function () {
			var aTaxTypeCodes = []; //problem 
			//extracting charge & tax types; setting flag for allowing adding tax - if any
			var aChargeTypeCodes = this._oComponent.getModel("_MD").getProperty("/AllChargeTypeCodes");

			if (aChargeTypeCodes.length > 0) {
				for (var i = 0; i < aChargeTypeCodes.length; i++) {
					if (aChargeTypeCodes[i].TaxRelevanceIndicator == 'X') {
						this._oDVModel.setProperty("/NewTaxesAllowed", true);
						aTaxTypeCodes.push(aChargeTypeCodes[i]);
						aChargeTypeCodes.splice(i, 1);
					}
				}

				this._oComponent.getModel("_MD").setProperty("/TaxTypeCodes", aTaxTypeCodes);
				this._oComponent.getModel("_MD").setProperty("/ChargeTypeCodes", aChargeTypeCodes);
			} else {
				this._oDVModel.setProperty("/NewTaxesAllowed", false);
			}

		},

		/*called from - InvoiceSubmissionTable worklist on hit of CreateInvoice button
		generating a new InvoiceUUID everytime 
		*/
		onCreateInvoicePress: function (fnRefreshTable) {
			this.fnRefreshTable = fnRefreshTable;
			var aSelectedFOIds = this._prepareIdsArrayFromBindingContextsArray("TransportationOrderUUID");
			var aSelectedFOsBindingContexts = this._oComponent.getModel("_SD").getProperty("/SelectedItems");
			var aFOsForInvoiceCreation = this.preapreCreateInvoiceObject(aSelectedFOsBindingContexts);

			var oPayload = {
				to_FreightOrders: aFOsForInvoiceCreation
			};
			this.getModel().create("/" + this.sInvoicesEntitySet, oPayload, {
				success: function (oData) {
					if (oData.InvoiceUUID) {
						this.navigateToCreateInvoiceView(oData.InvoiceUUID, aSelectedFOIds);
					}
				}.bind(this),
				error: function (oErr) {
					this._oComponent.ownerComponent._oErrorHandler.callMultipleErrorDialog(oErr);
				}.bind(this)
			});

		},
		navigateToCreateInvoiceView: function (sInvoiceId, aSelectedFOIds) {
			this._oComponent.getRouter().navTo("createInvoice", {
				invoiceId: sInvoiceId,
				selectedFOs: JSON.stringify(aSelectedFOIds)
			});
		},
		_prepareIdsArrayFromBindingContextsArray: function (sId) {
			var aSelectedItemsBindingContexts = this._oComponent.getModel("_SD").getProperty("/SelectedItems");
			var aIds = [];
			for (var i = 0; i < aSelectedItemsBindingContexts.length; i++) {
				aIds.push(aSelectedItemsBindingContexts[i].getProperty(sId));
			}
			return aIds;
		},
		preapreCreateInvoiceObject: function (aSelectedFOsBindingContexts) {
			var aFreightOrders = [];
			for (var i = 0; i < aSelectedFOsBindingContexts.length; i++) {
				var oFO = {};
				oFO.TransportationOrderUUID = aSelectedFOsBindingContexts[i].getProperty("TransportationOrderUUID");
				oFO.CarrierUUID = aSelectedFOsBindingContexts[i].getProperty("CarrierUUID");
				aFreightOrders.push(oFO);
			}
			return aFreightOrders;
		},
		addFODataToInvoiceInfo: function (oFreightOrder, aChargeItems) {
			//extracting out Tax line items in another entity
			this.getTaxItemsOut(oFreightOrder, aChargeItems);

			oFreightOrder.to_ChargeItems = aChargeItems;

			var aFreightOrders = this._oCIModel.getProperty("/FreightOrders");

			aFreightOrders.push(oFreightOrder);
			this._oCIModel.setProperty("/FreightOrders", aFreightOrders);
		},

		getTaxItemsOut: function (oFreightOrder, aChargeItems) {
			var aTaxItems = [];
			for (var i = 0; i < aChargeItems.length; i++) {
				if (aChargeItems[i].TaxIndicator) {
					aTaxItems.push(aChargeItems[i]);
					aChargeItems.splice(i, 1);
					this._oDVModel.setProperty("/TaxPanelExpanded", true);
				}
			}
			oFreightOrder.to_TaxItems = aTaxItems;
		},

		_clearFreightOrdersData: function () {
			this._oCIModel.setProperty("/FreightOrders", []);
		},

		onUpdateInvoiceHeader: function (oEvent, fnCallBack) {
			this.fnCallBack = fnCallBack;
			var oCore = sap.ui.getCore();
			var oViewBindingContext = oEvent.getSource().getBindingContext();
			//oViewBindingContext.getModel().setDefaultBindingMode("TwoWay");
			if (!this.oUpdateInvoiceDialog) {
				var oFragment = sap.ui.xmlfragment(this.updateInvoiceDialogId,
					"com.westernacher.collaborationPortal.invoicesubmission.fragment.editInvoiceHeader",
					this);
				this.oUpdateInvoiceDialog = oFragment;
				this._bindModelsToFragment(this.oUpdateInvoiceDialog);
				this._bindItemDataToFragment([oViewBindingContext], this.oUpdateInvoiceDialog);

				var dInvDate = this.dateFormatter.format(oViewBindingContext.getProperty("InvoiceDate"));
				oCore.byId(this.updateInvoiceDialogId + "--idUpdateInvoiceDate").setValue(dInvDate);
				this.oUpdateInvoiceDialog.open();
			}
		},
		onUpdateInvoiceConfirm: function () {
			var oCore = sap.ui.getCore();
			var oViewBindingContext = this.oUpdateInvoiceDialog.getBindingContext();
			var oInvoiceNumber = oCore.byId(this.updateInvoiceDialogId + "--idUpdateInvoiceNumber");
			var oInvoiceDate = oCore.byId(this.updateInvoiceDialogId + "--idUpdateInvoiceDate");

			var sInvoiceNumber = oInvoiceNumber.getValue();
			var sInvoiceDate = oInvoiceDate.getValue();
			var dInvoiceDate = this.dateFormatterUTC.parse(sInvoiceDate);
			/*	if (sInvoiceNumber){
					oInvoiceNumber.setValueState("None");
					oInvoiceNumber.setShowValueStateMessage(false);
					oViewBindingContext.getModel().setProperty(oViewBindingContext.sPath+"/CarrierReference", sInvoiceNumber);
				}
				else {
					oInvoiceNumber.setValueState("Error");
					oInvoiceNumber.setValueStateText("Please provide Invoice Number");
					return;
				}
				if (dInvoiceDate){
					oViewBindingContext.getModel().setProperty(oViewBindingContext.sPath+"/InvoiceDate", dInvoiceDate);
				}*/
			if (this.fnCallBack) {
				this.fnCallBack(sInvoiceNumber, dInvoiceDate);
			}
			this.onUpdateInvoiceCancel();

		},
		afterCloseUpdateInvoiceDialog: function () {
			this.oUpdateInvoiceDialog.destroy();
			this.oUpdateInvoiceDialog = null;
		},
		onUpdateInvoiceCancel: function () {
			this.oUpdateInvoiceDialog.close();
		},

		onCancelInvoice: function (oEvent) {
			var sMessage = this.i18n.getProperty("CancelInvoiceConfirmationMessage");
			this._callChargesCalculationFunction(oEvent, this._navigateToList.bind(this), sMessage);
		},
		onSubmitInvoice: function (oEvent, sInvoiceNumber, dInvoiceDate) {
			var aSelectedItems = this._oComponent.getModel("_SD").getProperty("/SelectedItems");
			var oSource = oEvent.getSource();

			//assigning user provided Invoice number & Date to _SD model
			//var sInvoiceNumber = oSource.getBindingContext().getProperty("CarrierReference");
			var dInvoiceDate = oSource.getBindingContext().getProperty("InvoiceDate");

			aSelectedItems[0].getProperty(aSelectedItems[0].sPath).CarrierReference = sInvoiceNumber;
			aSelectedItems[0].getProperty(aSelectedItems[0].sPath).InvoiceDate = dInvoiceDate;
			this._oComponent.getModel("_SD").setProperty("/SelectedItems", aSelectedItems);

			var sMessage = this.i18n.getProperty("SubmitInvoiceConfirmationMessage");
			this._callChargesCalculationFunction(oEvent, this._navigateToList.bind(this), sMessage);
		},
		onCalculateCharge: function (oEvent, fnSuccessCallback) {
			var sMessage = this.i18n.getProperty("RecalculateChargesConfirmationMessage");
			this._callChargesCalculationFunction(oEvent, fnSuccessCallback, sMessage);
		},
		_callChargesCalculationFunction: function (oEvent, fnSuccessCallback, sMessage) {
			var aSelectedItems = this._oComponent.getModel("_SD").getProperty("/SelectedItems");
			var oButton = oEvent.getSource();
			MessageBox.confirm(sMessage, {
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				styleClass: "sapUiSizeCompact",
				onClose: function (oAction) {
					if (oAction === sap.m.MessageBox.Action.NO) {
						return;
					}
					this._oComponent._AH.onActionNoInputPress(aSelectedItems, oButton, fnSuccessCallback);
				}.bind(this)
			});
		},
		_navigateToList: function () {
			this._oComponent.getRouter().navTo("master", {}, true);
			this.fnRefreshTable();
		},

		/**Update FO logistical charge items
		 **/
		onUpdateFOQuantities: function (oEvent, fnCallBack) {
			this.fnCallBack = fnCallBack;
			var oFOBindingContext = oEvent.getSource().getBindingContext("_CI");
			oFOBindingContext.getModel().setDefaultBindingMode("OneWay");
			if (!this.oUpdateFOQuantitiesDialog) {
				var oFragment = sap.ui.xmlfragment(this.updateFOQuantitiesDialogId,
					"com.westernacher.collaborationPortal.invoicesubmission.fragment.updateFOValues",
					this);
				this.oUpdateFOQuantitiesDialog = oFragment;
				this._bindModelsToFragment(this.oUpdateFOQuantitiesDialog);
				this.oUpdateFOQuantitiesDialog.setModel(this._oCIModel);
				// Setting metadata model to fragment with model name, only for metadata binding
				this.oUpdateFOQuantitiesDialog.setModel(this._oComponent.getModel(), "_oMainService");
				this._bindItemDataToFragment([oFOBindingContext], this.oUpdateFOQuantitiesDialog);
				this.oUpdateFOQuantitiesDialog.open();
			}
		},
		onUpdateFreightOrderCancel: function () {
			this.oUpdateFOQuantitiesDialog.close();
		},
		onUpdateFreightOrderConfirmed: function () {
			var oFO = this._prepareUpdateObject();
			if (!oFO) {
				this.onUpdateFreightOrderCancel();
				return;
			}
			let oBindingContext = this.oUpdateFOQuantitiesDialog.getBindingContext();
			let sPathFO = oBindingContext.sPath;
			let oOriginalFO = oBindingContext.getProperty(oBindingContext.sPath);

			var sKey = oBindingContext.getProperty("TransportationOrderUUID");
			oFO.TransportationOrderUUID = sKey;

			oFO.InvoiceUUID = oBindingContext.getProperty("InvoiceUUID");

			//sending unit of respective fields from old value's units
			oFO.ChangedGrossVolumeUnit = oBindingContext.getProperty("TranspOrdGrossVolumeUnit");
			oFO.ChangedGrossWeightUnit = oBindingContext.getProperty("TranspOrdGrossWeightUnit");
			oFO.ChangedTotalDistanceUnit = oBindingContext.getProperty("TotalDistanceUnit");
			oFO.ChangedTotalAmountCurrency = oBindingContext.getProperty("TotalAmountCurrency");

			oFO.TranspOrdGrossVolume = oBindingContext.getProperty("TranspOrdGrossVolume");
			oFO.TranspOrdGrossVolumeUnit = oBindingContext.getProperty("TranspOrdGrossVolumeUnit");
			oFO.TranspOrdGrossWeight = oBindingContext.getProperty("TranspOrdGrossWeight");
			oFO.TranspOrdGrossWeightUnit = oBindingContext.getProperty("TranspOrdGrossWeightUnit");
			oFO.TotalDistance = oBindingContext.getProperty("TotalDistance");
			oFO.TotalDistanceUnit = oBindingContext.getProperty("TotalDistanceUnit");
			//oFO.TotalAmount = formatter.customCurrencyParser(oBindingContext.getProperty("TotalAmount"));
			oFO.TotalAmount = oBindingContext.getProperty("TotalAmount");
			oFO.TotalAmountCurrency = oBindingContext.getProperty("TotalAmountCurrency");

			oFO.PurchasingOrganizationName = oBindingContext.getProperty("PurchasingOrganizationName");
			oFO.DistanceChangeAllowed = oBindingContext.getProperty("DistanceChangeAllowed");
			oFO.RateChangeAllowed = oBindingContext.getProperty("RateChangeAllowed");
			oFO.GrossVolumeChangeAllowed = oBindingContext.getProperty("GrossVolumeChangeAllowed");
			oFO.GrossWeightChangeAllowed = oBindingContext.getProperty("GrossWeightChangeAllowed");
			oFO.QuantityChangeAllowed = oBindingContext.getProperty("QuantityChangeAllowed");
			oFO.NewChargeAllowed = oBindingContext.getProperty("NewChargeAllowed");

			// Removes decimal group character from price Ex: Comma in '1,000.00'
			//oFO.ChangedTotalAmount = formatter.removeDecimalGrpCharacterFromPrice(oFO.ChangedTotalAmount);

			var sObjectPath = this.getModel().createKey("ZWCP_C_SETLFreightOrders", {
				TransportationOrderUUID: sKey
			});
			this.getModel().update("/" + sObjectPath, oFO, {
				success: function () {
					this.callChargeItemsData(oOriginalFO, sPathFO, oBindingContext.getProperty("TransportationOrderUUID"), oBindingContext.getProperty(
						"InvoiceUUID"), this.fnCallBack);
					this.onUpdateFreightOrderCancel();
				}.bind(this),
				error: function (oErr) {
					this.onUpdateFreightOrderCancel();
					this._oComponent.ownerComponent._oErrorHandler.callMultipleErrorDialog(oErr);

				}.bind(this)
			});

		},
		_prepareUpdateObject: function () {
			var oFO = {};
			var anyAvailable = false;
			var oTotalDistanceInput = sap.ui.getCore().byId(this.updateFOQuantitiesDialogId + "--idFOUpdateChangedTotalDistance");
			var oChangedTotalInput = sap.ui.getCore().byId(this.updateFOQuantitiesDialogId + "--idFOUpdateChangedTotalAmount");
			var oChangedGrossVolumeInput = sap.ui.getCore().byId(this.updateFOQuantitiesDialogId + "--idFOUpdateChangedGrossVolume");
			var oChangedGrossWeightInput = sap.ui.getCore().byId(this.updateFOQuantitiesDialogId + "--idFOUpdateChangedGrossWeight");
			if (oTotalDistanceInput && oTotalDistanceInput.getEnabled()) {
				var sTotalDistanceInput = formatter.customCurrencyParser(oTotalDistanceInput.getValue());
				//if the Unit for Distance is MI, the totalDistanceInput needs to be converted to the value in KM before sending
				//Backend system only accept value in KM
				if (this._oComponent.ownerComponent.getModel("_MD").getProperty("/DefaultUnitForDistSet") === "MI") {
					sTotalDistanceInput = sTotalDistanceInput * 1.6093;
					sTotalDistanceInput = parseFloat(sTotalDistanceInput).toFixed(2);
				}

				oFO.ChangedTotalDistance = sTotalDistanceInput;
				anyAvailable = true;
			}
			if (oChangedTotalInput && oChangedTotalInput.getEnabled()) {
				oFO.ChangedTotalAmount = oChangedTotalInput.getValue();
				anyAvailable = true;
			}
			if (oChangedGrossVolumeInput && oChangedGrossVolumeInput.getEnabled()) {
				oFO.ChangedGrossVolumeValue = formatter.customCurrencyParser(oChangedGrossVolumeInput.getValue());
				anyAvailable = true;
			}
			if (oChangedGrossWeightInput && oChangedGrossWeightInput.getEnabled()) {
				oFO.ChangedGrossWeight = formatter.customCurrencyParser(oChangedGrossWeightInput.getValue());
				anyAvailable = true;
			}
			if (anyAvailable) {
				return oFO;
			} else {
				return false;
			}
		},
		afterCloseUpdateFreightOrderDialog: function () {
			this.oUpdateFOQuantitiesDialog.destroy();
			this.oUpdateFOQuantitiesDialog = null;
		},

		/** Validation on adding new charge type - only new type of charge can be added
		 **/
		onAddNewChargeTypeValidation: function (oEvent) {
			this.bChargeTypeValidationFailed = false;
			var sChargeTypeKey = oEvent.getSource().getSelectedItem().getKey();
			var oFOContext = oEvent.getSource().getParent().getBindingContext();
			var aFOChargeItems = oFOContext.getProperty("to_ChargeItems");
			for (var i = 0; i < aFOChargeItems.length; i++) {
				if (aFOChargeItems[i].ChargeTypeCode === sChargeTypeKey) {
					oEvent.getSource().setValueState("Error");
					oEvent.getSource().setValueStateText(this._i18nHomeModel.getResourceBundle().getText("NewChargeTypeAddValidation"));
					oEvent.getSource().setShowValueStateMessage(true);
					this.bChargeTypeValidationFailed = true;
					break;
				} else {
					oEvent.getSource().setValueState("None");
					oEvent.getSource().setShowValueStateMessage(false);
				}
			}
		},

		/** Validation on adding new Tax type - only new type of Tax can be added
		 **/
		onAddNewTaxTypeValidation: function (oEvent) {
			this.bChargeTypeValidationFailed = false;
			var sChargeTypeKey = oEvent.getSource().getSelectedItem().getKey();
			var oFOContext = oEvent.getSource().getParent().getBindingContext();
			var aFOChargeItems = oFOContext.getProperty("to_TaxItems");
			for (var i = 0; i < aFOChargeItems.length; i++) {
				if (aFOChargeItems[i].ChargeTypeCode === sChargeTypeKey) {
					oEvent.getSource().setValueState("Error");
					oEvent.getSource().setValueStateText(this._i18nHomeModel.getResourceBundle().getText("NewChargeTypeAddValidation"));
					oEvent.getSource().setShowValueStateMessage(true);
					this.bChargeTypeValidationFailed = true;
					break;
				} else {
					oEvent.getSource().setValueState("None");
					oEvent.getSource().setShowValueStateMessage(false);
				}
			}
		},

		/** Adding a new Tax type
		 **/
		onAddTax: function (oEvent, oView, fnCallBack) {
			this.fnCallBack = fnCallBack;
			this.oViewBindingContext = oView.getBindingContext();
			var oBindingContext = oEvent.getSource().getBindingContext("_CI");
			if (!this.oAddTaxDialog) {
				var oFragment = sap.ui.xmlfragment(this.addTaxDialogId,
					"com.westernacher.collaborationPortal.invoicesubmission.fragment.addTax",
					this);
				this.oAddTaxDialog = oFragment;
				this._bindModelsToFragment(this.oAddTaxDialog);
				this.oAddTaxDialog.setModel(this._oCIModel);
				// Setting metadata model to fragment with model name, only for metadata binding
				this.oAddTaxDialog.setModel(this._oComponent.getModel(), "_oMainService");
				this._bindItemDataToFragment([oBindingContext], this.oAddTaxDialog);
				this.oAddTaxDialog.open();
			}
		},
		onAddTaxConfirmed: function () {
			var oCharge = this._prepareTaxObject();
			if (oCharge == null) {
				MessageBox.warning(this._i18nHomeModel.getResourceBundle().getText("NewChargeTypeMissing"), {
					onclose: null
				});
				return;
			}
			let InvoiceUUID = this.oViewBindingContext.sPath.split("'")[1];
			oCharge.InvoiceUUID = InvoiceUUID;

			let oBindingContext = this.oAddTaxDialog.getBindingContext();
			let sPathFO = oBindingContext.sPath;
			let oFO = oBindingContext.getProperty(sPathFO);
			oCharge.TransportationOrderUUID = oBindingContext.getProperty("TransportationOrderUUID");
			//addding ChargeLineLogisticalRefUUID & ChargeItemHostUUID as TransportationOrderUUID - observed from stand. portal
			oCharge.ChargeLineLogisticalRefUUID = oCharge.TransportationOrderUUID;
			oCharge.ChargeItemHostUUID = oCharge.TransportationOrderUUID;

			//adding unit of measures & currency from doc.
			oCharge.ChangedRateCurrency = oBindingContext.getProperty("TotalAmountCurrency");
			oCharge.ChangedQuantityUnitOfMeasure = "";
			oCharge.ChangedPriceUnitUnitOfMeasure = "";

			//Required flags in payload - add new Tax - Indicating Tax 
			oCharge.TaxIndicator = true;
			oCharge.ManuallyAddedIndicator = true;
			oCharge.HasMultipleCalcRules = false;

			// Removes decimal group character from price Ex: Comma in '1,000.00' ChangedRateAmount
			//oCharge.ChangedRateAmount = formatter.removeDecimalGrpCharacterFromPrice(oCharge.ChangedRateAmount);
			oCharge.ChangedRateAmount = formatter.customCurrencyParser(oCharge.ChangedRateAmount);

			this.getModel().create("/ZWCP_C_SETLOrderCharges", oCharge, {
				success: function () {
					this.callChargeItemsData(oFO, sPathFO, oBindingContext.getProperty("TransportationOrderUUID"), InvoiceUUID, this.fnCallBack);
					this.onAddTaxCancel();
				}.bind(this),
				error: function (oErr) {
					this.onAddTaxCancel();
					this._oComponent.ownerComponent._oErrorHandler.callMultipleErrorDialog(oErr);

				}.bind(this)
			});
		},
		onAddTaxCancel: function () {
			this.oAddTaxDialog.close();
		},
		afterCloseAddTaxDialog: function () {
			this.oAddTaxDialog.destroy();
			this.oAddTaxDialog = null;
		},
		_prepareTaxObject: function () {
			var oTax = {};
			var oTaxTypeInput = sap.ui.getCore().byId(this.addTaxDialogId + "--idAddTaxTaxType");
			var oTaxQuantityInput = sap.ui.getCore().byId(this.addTaxDialogId + "--idAddTaxQuantity");
			var oTaxAmountInput = sap.ui.getCore().byId(this.addTaxDialogId + "--idAddTaxAmount");
			if (oTaxTypeInput && oTaxTypeInput.getEnabled()) {
				if (!(oTaxTypeInput.getSelectedKey()) || this.bChargeTypeValidationFailed) {
					oTaxTypeInput.setValueState("Error");
					return null;
				}
				oTax.ChargeTypeCode = oTaxTypeInput.getSelectedKey();
				oTax.ChargeTypeDescription = oTaxTypeInput.getSelectedItem().getText();
			}
			if (oTaxQuantityInput && oTaxQuantityInput.getEnabled()) {
				oTax.ChangedQuantity = oTaxQuantityInput.getValue();
			}
			if (oTaxAmountInput && oTaxAmountInput.getEnabled()) {
				oTax.ChangedRateAmount = oTaxAmountInput.getValue();
			}
			return oTax;
		},

		/**Adding a new charge type
		 **/
		onAddCharge: function (oEvent, oView, fnCallBack) {
			this.fnCallBack = fnCallBack;
			this.oViewBindingContext = oView.getBindingContext();
			var oBindingContext = oEvent.getSource().getBindingContext("_CI");
			if (!this.oAddChargeDialog) {
				var oFragment = sap.ui.xmlfragment(this.addChargeDialogId,
					"com.westernacher.collaborationPortal.invoicesubmission.fragment.addCharge",
					this);
				this.oAddChargeDialog = oFragment;
				this._bindModelsToFragment(this.oAddChargeDialog);
				this.oAddChargeDialog.setModel(this._oCIModel);
				// Setting metadata model to fragment with model name, only for metadata binding
				this.oAddChargeDialog.setModel(this._oComponent.getModel(), "_oMainService");
				this._bindItemDataToFragment([oBindingContext], this.oAddChargeDialog);
				this.oAddChargeDialog.open();
			}
		},
		onAddChargeConfirmed: function () {
			var oCharge = this._prepareChargeObject();
			if (oCharge == null) {
				MessageBox.warning(this._i18nHomeModel.getResourceBundle().getText("NewChargeTypeMissing"), {
					onclose: null
				});
				return;
			}
			let InvoiceUUID = this.oViewBindingContext.sPath.split("'")[1];
			oCharge.InvoiceUUID = InvoiceUUID;

			let oBindingContext = this.oAddChargeDialog.getBindingContext();
			let sPathFO = oBindingContext.sPath;
			let oFO = oBindingContext.getProperty(sPathFO);

			oCharge.TransportationOrderUUID = oBindingContext.getProperty("TransportationOrderUUID");
			//addding ChargeLineLogisticalRefUUID & ChargeItemHostUUID as TransportationOrderUUID - observed from stand. portal
			oCharge.ChargeLineLogisticalRefUUID = oCharge.TransportationOrderUUID;
			oCharge.ChargeItemHostUUID = oCharge.TransportationOrderUUID;

			//adding unit of measures & currency from doc.
			oCharge.ChangedRateCurrency = oBindingContext.getProperty("TotalAmountCurrency");
			oCharge.ChangedQuantityUnitOfMeasure = "";
			oCharge.ChangedPriceUnitUnitOfMeasure = "";

			//Required flags in payload - add new Charge
			oCharge.ManuallyAddedIndicator = true;
			oCharge.TaxIndicator = false;
			oCharge.HasMultipleCalcRules = false;

			// Removes decimal group character from price Ex: Comma in '1,000.00' ChangedRateAmount
			oCharge.ChangedRateAmount = formatter.customCurrencyParser(oCharge.ChangedRateAmount);
			oCharge.ChangedPriceUnit = formatter.customCurrencyParser(oCharge.ChangedPriceUnit);

			this.getModel().create("/ZWCP_C_SETLOrderCharges", oCharge, {
				success: function () {
					this.callChargeItemsData(oFO, sPathFO, oBindingContext.getProperty("TransportationOrderUUID"), InvoiceUUID, this.fnCallBack);
					this.onAddChargeCancel();
				}.bind(this),
				error: function (oErr) {
					this.onAddChargeCancel();
					this._oComponent.ownerComponent._oErrorHandler.callMultipleErrorDialog(oErr);
				}.bind(this)
			});
		},
		onAddChargeCancel: function () {
			this.oAddChargeDialog.close();
		},
		afterCloseAddChargeDialog: function () {
			this.oAddChargeDialog.destroy();
			this.oAddChargeDialog = null;
		},
		_prepareChargeObject: function () {
			var oCharge = {};
			var oChargeTypeInput = sap.ui.getCore().byId(this.addChargeDialogId + "--idAddChargeChargeType");
			var oChargeQuantityInput = sap.ui.getCore().byId(this.addChargeDialogId + "--idAddChargeQuantity");
			var oChargeAmountInput = sap.ui.getCore().byId(this.addChargeDialogId + "--idAddChargeAmount");
			var oChargePriceInput = sap.ui.getCore().byId(this.addChargeDialogId + "--idAddChargePrice");
			if (oChargeTypeInput && oChargeTypeInput.getEnabled()) {
				if (!(oChargeTypeInput.getSelectedKey()) || this.bChargeTypeValidationFailed) {
					oChargeTypeInput.setValueState("Error");
					return null;
				}
				oCharge.ChargeTypeCode = oChargeTypeInput.getSelectedKey();
				oCharge.ChargeTypeDescription = oChargeTypeInput.getSelectedItem().getText();
			}
			if (oChargeQuantityInput && oChargeQuantityInput.getEnabled()) {
				oCharge.ChangedQuantity = oChargeQuantityInput.getValue();
			}
			if (oChargeAmountInput && oChargeAmountInput.getEnabled()) {
				oCharge.ChangedRateAmount = oChargeAmountInput.getValue();
			}
			if (oChargePriceInput && oChargePriceInput.getEnabled()) {
				oCharge.ChangedPriceUnit = oChargePriceInput.getValue();
			}
			return oCharge;
		},

		/** Editing Charge Item 
			Opening Edit Charge Item dialog
		**/
		onUpdateCharge: function (oEvent, fnCallBack) {
			this.fnCallBack = fnCallBack;
			var oChargeBindingContext = oEvent.getSource().getBindingContext("_CI");
			oChargeBindingContext.getModel().setDefaultBindingMode("OneWay");
			if (!this.oUpdateChargeDialog) {
				var oFragment = sap.ui.xmlfragment(this.updateChargeDialogId,
					"com.westernacher.collaborationPortal.invoicesubmission.fragment.updateCharge",
					this);
				this.oUpdateChargeDialog = oFragment;
				this._bindModelsToFragment(this.oUpdateChargeDialog);
				this.oUpdateChargeDialog.setModel(this._oCIModel);
				// Setting metadata model to fragment with model name, only for metadata binding
				this.oUpdateChargeDialog.setModel(this._oComponent.getModel(), "_oMainService");
				this._bindItemDataToFragment([oChargeBindingContext], this.oUpdateChargeDialog);
				this.oUpdateChargeDialog.open();
			}
		},
		afterCloseUpdateChargeDialog: function () {
			this.oUpdateChargeDialog.destroy();
			this.oUpdateChargeDialog = null;
		},
		onUpdateChargeCancel: function () {
			this.oUpdateChargeDialog.close();
		},
		onUpdateChargeConfirmed: function () {
			//fetching user provided Rate Amount/Quantity for Charge item
			var oCharge = this._prepareUpdateCharge();

			let oBindingContext = this.oUpdateChargeDialog.getBindingContext();

			//fetching selected FO
			var sPath = oBindingContext.sPath;
			var aPath = sPath.split("/");
			let sPathFO = "/" + aPath[1] + "/" + aPath[2];
			let oFO = oBindingContext.getModel().getProperty(sPathFO);

			//checking for any changed user input values
			/*	if ((oCharge.ChangedRateAmount === oBindingContext.getProperty("ChangedRateAmount")) || (oCharge.ChangedQuantity === oBindingContext.getProperty("ChangedQuantity"))){
					sap.m.MessageBox.show("Please Provide new Amount/Quantity",{
						onclose: null
					});
					return;
					
				}*/
			//passing ChangedRateCurrency as RateCurrency & ChangedQuantityUnitOfMeasure as QuantityUnitOfMeasure
			oCharge.ChangedRateCurrency = oBindingContext.getProperty("RateCurrency");
			if (oCharge.ChangedQuantity === '') {
				oCharge.ChangedQuantity = oBindingContext.getProperty("Quantity");
			}
			oCharge.ChangedQuantityUnitOfMeasure = oBindingContext.getProperty("QuantityUnitOfMeasure");

			//preparing payload
			//oCharge.RateAmount = formatter.customCurrencyParser(oBindingContext.getProperty("RateAmount"));
			oCharge.RateAmount = oBindingContext.getProperty("RateAmount");
			oCharge.RateCurrency = oBindingContext.getProperty("RateCurrency");
			oCharge.FinalAmount = oBindingContext.getProperty("ChangedRateAmount");
			oCharge.FinalAmountCurrency = oBindingContext.getProperty("ChangedRateCurrency");
			oCharge.Quantity = oBindingContext.getProperty("Quantity");
			oCharge.QuantityUnitOfMeasure = oBindingContext.getProperty("QuantityUnitOfMeasure");
			oCharge.InvoiceUUID = oBindingContext.getProperty("InvoiceUUID");
			oCharge.InvoiceDisputeUUID = oBindingContext.getProperty("InvoiceDisputeUUID");
			oCharge.InvoiceDisputeItemSourceKey = oBindingContext.getProperty("InvoiceDisputeItemSourceKey");
			oCharge.ChargeItemHostUUID = oBindingContext.getProperty("ChargeItemHostUUID");
			oCharge.CalculationSheetChargeTypeUUID = oBindingContext.getProperty("CalculationSheetChargeTypeUUID");
			oCharge.ChargeTypeCode = oBindingContext.getProperty("ChargeTypeCode");
			oCharge.ChargeItemDescription = oBindingContext.getProperty("ChargeItemDescription");
			oCharge.ChargeLineLogisticalRefUUID = oBindingContext.getProperty("ChargeLineLogisticalRefUUID");
			oCharge.HasMultipleCalcRules = oBindingContext.getProperty("HasMultipleCalcRules");
			oCharge.TransportationOrderUUID = oBindingContext.getProperty("TransportationOrderUUID");

			// Removes decimal group character from price Ex: Comma in '1,000.00' ChangedRateAmount
			oCharge.ChangedRateAmount = formatter.customCurrencyParser(oCharge.ChangedRateAmount);

			//Added addtional properties for payload - compared from stand. portal
			oCharge.ChargeItemGroup = oBindingContext.getProperty("ChargeItemGroup");
			oCharge.ChargeTypeDescription = oBindingContext.getProperty("ChargeTypeDescription");

			oCharge.PriceUnit = oBindingContext.getProperty("PriceUnit");
			oCharge.PriceUnitUnitOfMeasure = oBindingContext.getProperty("PriceUnitUnitOfMeasure");
			oCharge.FinalAmount = oBindingContext.getProperty("FinalAmount");
			oCharge.FinalAmountCurrency = oBindingContext.getProperty("FinalAmountCurrency");

			oCharge.ChangedPriceUnit = oBindingContext.getProperty("ChangedPriceUnit");
			oCharge.ChangedPriceUnitUnitOfMeasure = oBindingContext.getProperty("ChangedPriceUnitUnitOfMeasure");
			oCharge.ChangedFinalAmount = oBindingContext.getProperty("ChangedFinalAmount");
			oCharge.ChangedFinalAmountCurrency = oBindingContext.getProperty("ChangedFinalAmountCurrency");

			oCharge.ManualDisputeIndicator = oBindingContext.getProperty("ManualDisputeIndicator");
			oCharge.TaxIndicator = oBindingContext.getProperty("TaxIndicator");
			oCharge.ManuallyAddedIndicator = oBindingContext.getProperty("ManuallyAddedIndicator");

			oCharge.DisputeStatus = oBindingContext.getProperty("DisputeStatus");
			oCharge.InvoiceIrrelevanceIndicator = oBindingContext.getProperty("InvoiceIrrelevanceIndicator");
			oCharge.PreviousInvoiceAmount = oBindingContext.getProperty("PreviousInvoiceAmount");
			oCharge.PreviousInvoiceAmountCurrency = oBindingContext.getProperty("PreviousInvoiceAmountCurrency");

			//End - Added addtional properties for payload

			var sKey = oBindingContext.getProperty("ChargeElementUUID");
			oCharge.ChargeElementUUID = sKey;
			var sObjectPath = this.getModel().createKey("ZWCP_C_SETLOrderCharges", {
				ChargeElementUUID: sKey
			});
			this.getModel().update("/" + sObjectPath, oCharge, {
				success: function () {

					this.callChargeItemsData(oFO, sPathFO, oBindingContext.getProperty("TransportationOrderUUID"), oBindingContext.getProperty(
						"InvoiceUUID"), this.fnCallBack);
					this.onUpdateChargeCancel();
				}.bind(this),
				error: function (oErr) {
					this.onUpdateChargeCancel();
					this._oComponent.ownerComponent._oErrorHandler.callMultipleErrorDialog(oErr);

				}.bind(this)
			});
		},

		/**Removing back the proposed charges
		 **/
		onRemoveChargeProposal: function (oEvent, fnCallBack) {
			var oBindingContext = oEvent.getSource().getBindingContext("_CI");
			//fetching FO
			var sPath = oBindingContext.sPath;
			var aPath = sPath.split("/");
			let sPathFO = "/" + aPath[1] + "/" + aPath[2];
			let oFO = oBindingContext.getModel().getProperty(sPathFO);

			var sKey = oBindingContext.getProperty("ChargeElementUUID");
			var sObjectPath = this.getModel().createKey("ZWCP_C_SETLOrderCharges", {
				ChargeElementUUID: sKey
			});
			this.getModel().remove("/" + sObjectPath, {
				success: function () {

					this.callChargeItemsData(oFO, sPathFO, oBindingContext.getProperty("TransportationOrderUUID"), oBindingContext.getProperty(
						"InvoiceUUID"), fnCallBack);
				}.bind(this),
				error: function (oErr) {
					this._oComponent.ownerComponent._oErrorHandler.callMultipleErrorDialog(oErr);
				}.bind(this)
			});
		},

		/**Excluding a charge item
		 **/
		onExcludeChargeItem: function (oEvent, fnCallBack) {
			var oCharge = {};
			var oBindingContext = oEvent.getSource().getBindingContext("_CI");
			//fetching FO
			var sPath = oBindingContext.sPath;
			var aPath = sPath.split("/");
			let sPathFO = "/" + aPath[1] + "/" + aPath[2];
			let oFO = oBindingContext.getModel().getProperty(sPathFO);

			// oCharge.RateAmount = formatter.customCurrencyParser(oBindingContext.getProperty("RateAmount"));
			oCharge.RateAmount = oBindingContext.getProperty("RateAmount");
			oCharge.RateCurrency = oBindingContext.getProperty("RateCurrency");
			oCharge.Quantity = oBindingContext.getProperty("Quantity");
			oCharge.QuantityUnitOfMeasure = oBindingContext.getProperty("QuantityUnitOfMeasure");
			//voodoo ChangedRateAmount as RateAmount & ChangedQuantity as Quantity
			oCharge.ChangedRateAmount = oCharge.RateAmount;
			oCharge.ChangedQuantity = oCharge.Quantity;

			oCharge.ChangedRateCurrency = oBindingContext.getProperty("ChangedRateCurrency");
			oCharge.InvoiceUUID = oBindingContext.getProperty("InvoiceUUID");
			oCharge.InvoiceDisputeUUID = oBindingContext.getProperty("InvoiceDisputeUUID");
			oCharge.InvoiceDisputeItemSourceKey = oBindingContext.getProperty("InvoiceDisputeItemSourceKey");
			oCharge.ChargeItemHostUUID = oBindingContext.getProperty("ChargeItemHostUUID");
			oCharge.CalculationSheetChargeTypeUUID = oBindingContext.getProperty("CalculationSheetChargeTypeUUID");
			oCharge.ChargeTypeCode = oBindingContext.getProperty("ChargeTypeCode");
			oCharge.ChargeItemDescription = oBindingContext.getProperty("ChargeItemDescription");
			oCharge.ChargeLineLogisticalRefUUID = oBindingContext.getProperty("ChargeLineLogisticalRefUUID");
			oCharge.DisputeStatus = oBindingContext.getProperty("DisputeStatus");
			oCharge.HasMultipleCalcRules = oBindingContext.getProperty("HasMultipleCalcRules");
			oCharge.TransportationOrderUUID = oBindingContext.getProperty("TransportationOrderUUID");
			//flag - hardcoded
			oCharge.InvoiceIrrelevanceIndicator = true;

			var sKey = oBindingContext.getProperty("ChargeElementUUID");
			var sObjectPath = this.getModel().createKey("ZWCP_C_SETLOrderCharges", {
				ChargeElementUUID: sKey
			});
			this.getModel().update("/" + sObjectPath, oCharge, {
				success: function () {

					this.callChargeItemsData(oFO, sPathFO, oBindingContext.getProperty("TransportationOrderUUID"), oBindingContext.getProperty(
						"InvoiceUUID"), fnCallBack);
				}.bind(this),
				error: function (oErr) {
					this._oComponent.ownerComponent._oErrorHandler.callMultipleErrorDialog(oErr);

				}.bind(this)
			});
		},

		/**Including back the removed charge item
		 **/
		onIncludeChargeItem: function (oEvent, fnCallBack) {
			var oCharge = {};
			var oBindingContext = oEvent.getSource().getBindingContext("_CI");
			//fetching FO
			var sPath = oBindingContext.sPath;
			var aPath = sPath.split("/");
			let sPathFO = "/" + aPath[1] + "/" + aPath[2];
			let oFO = oBindingContext.getModel().getProperty(sPathFO);

			//oCharge.RateAmount = formatter.customCurrencyParser(oBindingContext.getProperty("RateAmount"));
			oCharge.RateAmount = oBindingContext.getProperty("RateAmount");
			oCharge.RateCurrency = oBindingContext.getProperty("RateCurrency");
			oCharge.Quantity = oBindingContext.getProperty("Quantity");
			oCharge.QuantityUnitOfMeasure = oBindingContext.getProperty("QuantityUnitOfMeasure");
			//voodoo - hardcoded
			oCharge.ChangedRateAmount = "0.0";
			oCharge.ChangedQuantity = "0.0";

			oCharge.ChangedRateCurrency = oBindingContext.getProperty("ChangedRateCurrency");
			oCharge.InvoiceUUID = oBindingContext.getProperty("InvoiceUUID");
			oCharge.InvoiceDisputeUUID = oBindingContext.getProperty("InvoiceDisputeUUID");
			oCharge.InvoiceDisputeItemSourceKey = oBindingContext.getProperty("InvoiceDisputeItemSourceKey");
			oCharge.ChargeItemHostUUID = oBindingContext.getProperty("ChargeItemHostUUID");
			oCharge.CalculationSheetChargeTypeUUID = oBindingContext.getProperty("CalculationSheetChargeTypeUUID");
			oCharge.ChargeTypeCode = oBindingContext.getProperty("ChargeTypeCode");
			oCharge.ChargeItemDescription = oBindingContext.getProperty("ChargeItemDescription");
			oCharge.ChargeLineLogisticalRefUUID = oBindingContext.getProperty("ChargeLineLogisticalRefUUID");
			oCharge.DisputeStatus = oBindingContext.getProperty("DisputeStatus");
			oCharge.HasMultipleCalcRules = oBindingContext.getProperty("HasMultipleCalcRules");
			oCharge.TransportationOrderUUID = oBindingContext.getProperty("TransportationOrderUUID");
			//flag - hardcoded
			oCharge.InvoiceIrrelevanceIndicator = false;

			var sKey = oBindingContext.getProperty("ChargeElementUUID");
			var sObjectPath = this.getModel().createKey("ZWCP_C_SETLOrderCharges", {
				ChargeElementUUID: sKey
			});
			this.getModel().update("/" + sObjectPath, oCharge, {
				success: function () {
					this.callChargeItemsData(oFO, sPathFO, oBindingContext.getProperty("TransportationOrderUUID"), oBindingContext.getProperty(
						"InvoiceUUID"), fnCallBack);
				}.bind(this),
				error: function (oErr) {
					this._oComponent.ownerComponent._oErrorHandler.callMultipleErrorDialog(oErr);

				}.bind(this)
			});
		},

		_prepareUpdateCharge: function () {
			var oCharge = {};
			var oChargeQuantityInput = sap.ui.getCore().byId(this.updateChargeDialogId + "--idUpdateChargeQuantity");
			var oChargeAmountInput = sap.ui.getCore().byId(this.updateChargeDialogId + "--idUpdateChargeAmount");

			if (oChargeQuantityInput && oChargeQuantityInput.getEnabled()) {
				oCharge.ChangedQuantity = oChargeQuantityInput.getValue();
			}

			if (oChargeAmountInput && oChargeAmountInput.getEnabled()) {
				oCharge.ChangedRateAmount = oChargeAmountInput.getValue();
			}

			return oCharge;
		},

		/**common method for all update operations on Invoice to backend
		 **/
		callChargeItemsData: function (oFO, sPathFO, sTransportationOrderUUID, sInvoiceKey, fnCallBack) {
			// Settings currency type and formatter here  since in xml not working
			var oCurrency = new sap.ui.model.type.Currency();

			var oFilterProp = new Filter("InvoiceUUID", "EQ", sInvoiceKey);
			let sFOKey = this.getModel().createKey("ZWCP_C_SETLFreightOrders", {
				TransportationOrderUUID: sTransportationOrderUUID
			});

			this.getModel().read("/" + sFOKey, {
				filters: [oFilterProp],
				success: function (oData, oResponse) {
					let oFreightOrder = oData;
					// 	oFreightOrder.TotalAmount = formatter.numberUnit(oFreightOrder.TotalAmount);
					// 	oFreightOrder.TotalAmount = oCurrency.formatValue([oFreightOrder.TotalAmount], "string");
					// 	oFreightOrder.ChangedTotalAmount = formatter.numberUnit(oFreightOrder.ChangedTotalAmount);
					// 	oFreightOrder.ChangedTotalAmount = oCurrency.formatValue([oFreightOrder.ChangedTotalAmount], "string");

					this.getModel().read("/" + sFOKey + "/to_ChargeItems", {
						filters: [oFilterProp],
						success: function (oDataCharges, oResponseAssociation) {
							oDataCharges.results.forEach(function (r) {
								// r.RateAmount = formatter.numberUnit(r.RateAmount);
								// r.RateAmount = oCurrency.formatValue([r.RateAmount], "string");
								r.PriceUnit = formatter.numberUnit(r.PriceUnit);
								r.PriceUnit = oCurrency.formatValue([r.PriceUnit], "string");
								// r.FinalAmount = formatter.numberUnit(r.FinalAmount);
								// r.FinalAmount = oCurrency.formatValue([r.FinalAmount], "string");
								// r.ChangedRateAmount = formatter.numberUnit(r.ChangedRateAmount);
								// r.ChangedRateAmount = oCurrency.formatValue([r.ChangedRateAmount], "string");
								// r.ChangedFinalAmount = formatter.numberUnit(r.ChangedFinalAmount);
								// r.ChangedFinalAmount = oCurrency.formatValue([r.ChangedFinalAmount], "string");
							}.bind(this));
							this.replaceChargeItemsDatatoFO(oFreightOrder, sPathFO, oDataCharges.results, fnCallBack);
						}.bind(this)
					});
				}.bind(this),
				error: function (oErr) {}.bind(this)
			});

		},

		/**Replacing all charge items after every update operation
		 * also refresh on binding of all charge items to check on columns visibility accordingly
		 **/
		replaceChargeItemsDatatoFO: function (oFreightOrder, sPathFO, aChargeItems, fnCallBack) {
			//finding Tax items & replacing them in TaxItems entity
			this._extractTaxItems(oFreightOrder, aChargeItems);

			oFreightOrder.to_ChargeItems = aChargeItems;

			if (sPathFO) {
				//changing reference to trigger change event of selected FO binding
				this._oCIModel.setProperty(sPathFO, {});
				//replacing concerned FO in JSON model
				this._oCIModel.setProperty(sPathFO, oFreightOrder);
			}

			if (fnCallBack) {
				fnCallBack(sPathFO);
			}
		},

		/** extract out Tax items for display in separate table
		 * @private
		 **/
		_extractTaxItems: function (oFreightOrder, aChargeItems) {
			var aTaxItems = [];
			var i = aChargeItems.length - 1;
			for (i; i >= 0; i--) {
				if (aChargeItems[i].TaxIndicator) {
					aTaxItems.push(aChargeItems[i]);
					aChargeItems.splice(i, 1);
					this._oDVModel.setProperty("/TaxPanelExpanded", true);
				}
			}
			aTaxItems.reverse();
			oFreightOrder.to_TaxItems = aTaxItems;
		}

	});
});