sap.ui.define([
	"com/westernacher/collaborationPortal/core/controller/BaseController",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/format/DateFormat",
	"com/westernacher/collaborationPortal/core/model/formatter",
	"sap/ui/core/routing/HashChanger",
	"sap/ui/core/routing/History"
], function (BaseController, Controller, Filter, FilterOperator, DateFormat, formatter, HashChanger, History) {
	"use strict";

	return BaseController.extend("com.westernacher.collaborationPortal.quotation.controller.QuotationObjectPage", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.westernacher.collaborationPortal.confirmation.WCP_EXECUTION.view.ConfirmationObjectPage
		 */
		formatter: formatter,

		dateFormatter: DateFormat.getDateTimeInstance({
			pattern: "yyyy-MM-ddTHH:mm:ssZ"
		}),

		onInit: function () {
			this.oComponent = this.getOwnerComponent();
			this.oComponent.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
			this.bNewDataInRequest = false;
			/*var oFilterCargo = new Filter ("to_Items/TranspOrdItemCategory", FilterOperator.EQ, "PRD");
			var oFilterPackage = new Filter ("to_Items/TranspOrdItemCategory", FilterOperator.EQ, "PKG");
			this.oFilterView = new Filter({
				filters:[oFilterCargo, oFilterPackage],
				and: false
			});*/

		},

		onRouteMatched: function (oEvent) {
			sap.ui.core.BusyIndicator.hide();
			var oParameter = oEvent.getParameter("arguments");
			var oView = this.getView();
			var sKey = oParameter.Key;
			var sFOKey = oParameter.FOKey;
			if (!sKey) {
				return;
			}
			this.oModel = this.oComponent._QuotationH.setRoleModel(true, this.getView(), "QUOTE", this.oComponent.defaultAnnotation);
			oView.getModel().getMetaModel().loaded().then(function () {
				try {
					this.oComponent._AH.checkUserRoleMetaModel(this.oModel, this.oComponent._QuotationH.sUserRole);
					this.oComponent._AH.checkUserRoleMetaModelForEntity(this.oModel, this.oComponent._QuotationH.sUserRole, "ZWCP_C_RFQ");
				} catch (er) {
					return;
				}
			}.bind(this));

			this.oModel.metadataLoaded().then(function () {
				this.sObjectPath = oView.getModel().createKey("ZWCP_C_RFQ", {
					TenderingRequestNumber: sKey,
					TransportationOrderUUID: sFOKey
				});

				this._bindView("/" + this.sObjectPath);

			}.bind(this));
			this.oComponent._BEH.onObjectPageSelectionChange(sKey);
		},

		_bindView: function (sObjectPath) {
			this.getView().bindElement({
				path: sObjectPath,
				parameters: {
					expand: 'to_Quotes,to_Stops/to_CargoLoad,to_Stops/to_CargoUnload'
				},
				events: {
					dataRequested: function (oEvent) {
						this.bNewDataInRequest = true;
					}.bind(this),
					change: function (oResponse) {
						if (this.bNewDataInRequest === false) {
							this.getView().getElementBinding().refresh(false);
						}
						var aFOs = this._prepareBindingContextsDataFromObjectPage(this);
						this.getView().getModel("_SD").setProperty("/SelectedItems", aFOs);
						var oBindingContext = this.getView().getBindingContext();
						if (oBindingContext) {
							this.oComponent._BEH.onObjectPageSelectionChange(oBindingContext.getObject());
						}

						this.oComponent._StopH.loadStagesDataModel(this.getView().getBindingContext().getProperty("to_Stages"));
					}.bind(this),
					dataReceived: function (oEvent) {
						this.bNewDataInRequest = false;

						//Calling the function to create JSON model to set the Tree Table for Cargo Items
						var oStopsData = this.getView().getBindingContext().getObject({
							expand: "to_Items,to_Attachments,to_Stops/to_CargoLoad,to_Stops/to_CargoUnload"
						});
						//Calling the function to set the model to the cargo tree table
						this.setCargoTreeTableModel(oStopsData);

					}.bind(this)
				}
			});
		},

		onAcceptFOPress: function (oEvent) {
			var fnSuccessCallback = function () {
				this.getView().getElementBinding().refresh(false);
			};
			var aFOs = this.oComponent.getModel("_SD").getProperty("/SelectedItems");
			this.oComponent._AH.onActionNoInputPress(aFOs, oEvent.getSource(), fnSuccessCallback.bind(this));
		},

		onRejectFOPress: function (oEvent) {
			this.oComponent._QuotationH.onRejectFOPress(this.refreshView.bind(this));
		},
		onAcceptWithChange: function () {
			this.oComponent._QuotationH.onAcceptWithChangePress(this.refreshView.bind(this));
		},

		//added to refresh bindings
		refreshView: function (sPathFO) {
			this.getView().getElementBinding().refresh(false);
		},

		onHomeLinkPress: function (oEvent) {
			var oHashChanger = HashChanger.getInstance();
			oHashChanger.init();
			oHashChanger.setHash("");
		},

		setCargoTreeTableModel: function (oStopData) {
			var oData = oStopData;
			var oUpdatedJSONModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(oUpdatedJSONModel, "CargoTreeModel");

			var oFinalData = [];

			//oData.to_stops contains the stops list, loop inside it to get the items for load and unload
			for (var i = 0; i < oData.to_Stops.length; i++) {
				var oTempStore = oData.to_Stops[i]; //Temporary store for the particular stop, to avoid using it everywhere.
				//Parent stop object to hold the data.
				var DateTimeOptions = {
					timeZone: 'UTC',
					year: 'numeric',
					month: 'short',
					day: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					second: 'numeric',
					hour12: true
				};
				var oTempStopParent = {
					TenderingRequestNumber: oData.TenderingRequestNumber ? oData.TenderingRequestNumber : "",
					Location: oTempStore.LocationDescription ? oTempStore.LocationDescription + ", " + oTempStore.StreetName + ", " + oTempStore.CityName +
						", " + oTempStore.PostalCode : "",
					StartDateTime: oData.to_Stops[i].SrceStopPlannedDateTimeF ? new Date(oData.to_Stops[i].SrceStopPlannedDateTimeF).toLocaleString(
							'en-US', DateTimeOptions) +
						" " + oData.to_Stops[i].SrcLocationTimeZone : "",
					EndDateTime: oData.to_Stops[i].DestStopPlannedDateTimeF ? new Date(oData.to_Stops[i].DestStopPlannedDateTimeF).toLocaleString(
							'en-US', DateTimeOptions) +
						" " + oData.to_Stops[i].DesLocationTimeZone : "",
					GrossWeight: 0,
					GrossVolume: 0,
					Quantity: 0,
					WeightUnit: "",
					VolumeUnit: "",
					QuantityUnit: "",
					ActualQuantity: "",
					nodes: []
				};
				//Loop inside cargo load only if there are items in the to_CargoLoad array
				if (oData.to_Stops[i].to_CargoLoad.length > 0) {
					var oTempChildLoad = this._CargoNodesCreator(oData.to_Stops[i].to_CargoLoad, "Load");
					oTempStopParent.nodes = (oTempStopParent.nodes).concat(oTempChildLoad.childNode);
					//Updating Gross measurement fields
					oTempStopParent.GrossWeight += parseFloat(oTempChildLoad.grossData.GrossWeight);
					oTempStopParent.GrossVolume += parseFloat(oTempChildLoad.grossData.GrossVolume);
					oTempStopParent.Quantity += parseFloat(oTempChildLoad.grossData.Quantity);
					//Updating Weight Unit Fields
					oTempStopParent.WeightUnit = oTempChildLoad.grossData.WeightUnit;
					oTempStopParent.VolumeUnit = oTempChildLoad.grossData.VolumeUnit;
					oTempStopParent.QuantityUnit = oTempChildLoad.grossData.QuantityUnit;
				}
				//Loop inside cargo unload only if there are items in the to_CargoUnLoad array
				if (oData.to_Stops[i].to_CargoUnload.length > 0) {
					var oTempChildUnload = this._CargoNodesCreator(oData.to_Stops[i].to_CargoUnload, "UnLoad");
					oTempStopParent.nodes = (oTempStopParent.nodes).concat(oTempChildUnload.childNode);
					//Updating Gross measurement fields
					oTempStopParent.GrossWeight += parseFloat(oTempChildUnload.grossData.GrossWeight);
					oTempStopParent.GrossVolume += parseFloat(oTempChildUnload.grossData.GrossVolume);
					oTempStopParent.Quantity += parseFloat(oTempChildUnload.grossData.Quantity);
					//Updating Weight Unit Fields
					oTempStopParent.WeightUnit = oTempChildUnload.grossData.WeightUnit;
					oTempStopParent.VolumeUnit = oTempChildUnload.grossData.VolumeUnit;
					oTempStopParent.QuantityUnit = oTempChildUnload.grossData.QuantityUnit;
				}
				//Finally push the parent object containing all the load & unload items into the array
				oFinalData.push(oTempStopParent);
			}
			//Update the json model set to the tree table with the obtained array
			oUpdatedJSONModel.setData(oFinalData);
		},

		_CargoNodesCreator: function (oData, sCargoType) {
			var finalData = [];
			var tempGrossObj = {
				GrossWeight: 0,
				GrossVolume: 0,
				Quantity: 0,
				WeightUnit: "",
				VolumeUnit: "",
				QuantityUnit: ""
			};
			for (var i = 0; i < oData.length; i++) {
				var oTemStopChild = {
					Type: sCargoType,
					CargoItem: oData[i].ProductName ? oData[i].ProductName : "",
					IsDangerous: oData[i].TranspOrdItemIsDangerousGood ? oData[i].TranspOrdItemIsDangerousGood : false,
					//Weight and volume fields
					GrossWeight: oData[i].TranspOrdItemGrossWeight ? oData[i].TranspOrdItemGrossWeight : 0,
					GrossVolume: oData[i].TranspOrdItemGrossVolume ? oData[i].TranspOrdItemGrossVolume : 0,
					Quantity: oData[i].TranspOrdItemQuantity ? oData[i].TranspOrdItemQuantity : 0,
					TransportationOrderItemUUID: oData[i].TransportationOrderItemUUID ? oData[i].TransportationOrderItemUUID : "",
					StopUUID: oData[i].StopUUID ? oData[i].StopUUID : "",
					TransportationOrderUUID: oData[i].TransportationOrderUUID ? oData[i].TransportationOrderUUID : "",
					//Unit fields
					WeightUnit: oData[i].TranspOrdItemGrossWeightUnit ? oData[i].TranspOrdItemGrossWeightUnit : "",
					VolumeUnit: oData[i].TranspOrdItemGrossVolumeUnit ? oData[i].TranspOrdItemGrossVolumeUnit : "",
					QuantityUnit: oData[i].TranspOrdItemQuantityUnit ? oData[i].TranspOrdItemQuantityUnit : ""
				};
				//Adding properties based on type (loading/unloading)
				if (sCargoType === "Load") {
					//Storing ID fields in the payload for handling update operations
					oTemStopChild.SourceStopUUID = oData[i].SourceStopUUID ? oData[i].SourceStopUUID : "";
					//Storing two actual quantities, the old actual quantity will be used as a reference to check if the value has been changed from the front end during update process
					oTemStopChild.ActualQuantity = oData[i].ActualLoadingQuantity ? oData[i].ActualLoadingQuantity : 0;
					oTemStopChild.OldActualQuantity = oData[i].ActualLoadingQuantity ? oData[i].ActualLoadingQuantity : 0;
				} else if (sCargoType === "UnLoad") {
					//Storing ID fields in the payload for handling update operations
					oTemStopChild.DestinationStopUUID = oData[i].DestinationStopUUID ? oData[i].DestinationStopUUID : "";
					//Storing two actual quantities, the old actual quantity will be used as a reference to check if the value has been changed from the front end during update process
					oTemStopChild.ActualQuantity = oData[i].ActualUnloadingQuantity ? oData[i].ActualUnloadingQuantity : 0;
					oTemStopChild.OldActualQuantity = oData[i].ActualUnloadingQuantity ? oData[i].ActualUnloadingQuantity : 0;
				}
				//Adding the gross fields
				tempGrossObj.GrossWeight += oData[i].TranspOrdItemGrossWeight ? parseFloat(oData[i].TranspOrdItemGrossWeight) : 0;
				tempGrossObj.GrossVolume += oData[i].TranspOrdItemGrossVolume ? parseFloat(oData[i].TranspOrdItemGrossVolume) : 0;
				tempGrossObj.Quantity += oData[i].TranspOrdItemQuantity ? parseFloat(oData[i].TranspOrdItemQuantity) : 0;
				//Storing the unit fields in the parent
				tempGrossObj.WeightUnit = oData[i].TranspOrdItemGrossWeightUnit ? oData[i].TranspOrdItemGrossWeightUnit : 0;
				tempGrossObj.VolumeUnit = oData[i].TranspOrdItemGrossVolumeUnit ? oData[i].TranspOrdItemGrossVolumeUnit : 0;
				tempGrossObj.QuantityUnit = oData[i].TranspOrdItemQuantityUnit ? oData[i].TranspOrdItemQuantityUnit : 0;
				//Now the child object contains everything. Push it to the parent's nodes array.
				finalData.push(oTemStopChild);
			}

			return {
				childNode: finalData,
				grossData: tempGrossObj
			};
		},

		onPressBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash();
			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				// Back to worklist, if there is no previous history, Generally if we refresh the page at object page
				var oHashChanger = HashChanger.getInstance(),
					_oMDModel = this.oComponent.ownerComponent.getModel("_MD");
				oHashChanger.init();
				oHashChanger.setHash("FreightOrderQuotation/" + _oMDModel.getProperty("/UserInfo/CurrentBusinessPartnerRole"));
			}
		},

		onRefreshObjectView: function () {
			this.getView().getBindingContext().getModel().refresh(true);
		}

	});

});