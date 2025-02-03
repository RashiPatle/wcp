sap.ui.define([
	"com/westernacher/collaborationPortal/core/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/format/DateFormat",
	"com/westernacher/collaborationPortal/core/model/formatter",
	"sap/m/PDFViewer",
	"sap/m/Dialog",
	"sap/ui/core/HTML",
	"sap/m/MessageBox",
	"sap/ui/core/routing/HashChanger",
	"sap/ui/core/routing/History"
], function (BaseController, Filter, FilterOperator, DateFormat, formatter, PDFViewer, Dialog, HTML, MessageBox, HashChanger, History) {

	"use strict";

	return BaseController.extend("com.westernacher.collaborationPortal.fosExecution.controller.FOExecutionObject", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.westernacher.collaborationPortal.fosExecution.WCP_EXECUTION.view.FOExecutionObject
		 */
		formatter: formatter,
		onInit: function () {
			this.oComponent = this.getOwnerComponent();
			this.oComponent.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
			this.bNewDataInRequest = false;
			this.i18n = this.oComponent.getModel("i18n");

			// Setting display format to date by locale
			var oDateInstance = sap.ui.core.format.DateFormat.getDateInstance(),
				oTimeInstance = sap.ui.core.format.DateFormat.getTimeInstance();
			var sDateLocaleFormat = oDateInstance.aFallbackFormats[1].oFormatOptions.pattern,
				aTimeLocaleFormat = oTimeInstance.aFallbackFormats[0].oFormatOptions.pattern;
			sDateLocaleFormat = sDateLocaleFormat.match(/.{1,2}/g).join("/") + " " + aTimeLocaleFormat;
			this.oComponent.getModel("_SD").setProperty("/displayFormatByLocale", sDateLocaleFormat);

			this.oModel = this.oComponent._ExecH.setRoleModel(true, this.getView(), "EXECUTION", this.oComponent.defaultAnnotation);
		},

		onRouteMatched: function (oEvent) {
			sap.ui.core.BusyIndicator.hide();
			var oParameter = oEvent.getParameter("arguments");
			var oView = this.getView();
			var sKey = oParameter.Key;
			var sUUID = oParameter.UUID;
			if (!sKey || !sUUID) {
				return;
			}
			//	this.oComponent._EventH.onFilterBinding(oView, sUUID);
			this.oModel.getMetaModel().loaded().then(function () {
				try {
					this.oComponent._AH.checkUserRoleMetaModel(this.oModel, this.oComponent._ExecH.sUserRole);
					this.oComponent._AH.checkUserRoleMetaModelForEntity(this.oModel, this.oComponent._ExecH.sUserRole, "ZWCP_C_Execution");
				} catch (er) {
					return;
				}
			}.bind(this));

			this.oModel.metadataLoaded().then(function () {
				this.sObjectPath = oView.getModel().createKey("ZWCP_C_Execution", {
					FreightOrder: sKey
				});

				this._bindView("/" + this.sObjectPath);
				// this.getView().byId("idPackageTable").bindElement("to_Items");
			}.bind(this));
		},

		_bindView: function (sObjectPath) {
			//expand call to fetch all details of selected FO
			this.getView().bindElement({
				path: sObjectPath,
				parameters: {
					expand: 'to_Items,to_Attachments,to_Stops/to_CargoLoad,to_Stops/to_CargoUnload'
				},
				events: {
					dataRequested: function (oEvent) {
						this.bNewDataInRequest = true;
					}.bind(this),
					change: function () {
						if (this.bNewDataInRequest === false) {
							this.getView().getElementBinding().refresh(false);
						}
						var aFOs = this._prepareBindingContextsDataFromObjectPage(this);
						this.getView().getModel("_SD").setProperty("/SelectedItems", aFOs);
						this.oComponent._BEH.onObjectPageSelectionChange(this.getView().getBindingContext().getObject());
					}.bind(this),
					dataReceived: function (oEvent) {
						this.bNewDataInRequest = false;

						//fetching selected Item i.e. FO
						var oBindingContext = this.getView().getBindingContext();

						//obtaining UUID of selected FO
						var sUUID = oBindingContext.getProperty("TransportationOrderUUID_F");

						//setting up the selected FO Event's Timeline content binding
						this.oComponent._EventH.onFilterBinding(this.getView(), sUUID);

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

		onUpdateFOPress: function () {
			this.oComponent._ExecH.onUpdateFreightOrderPress(this.onUpdateFODatesObjectPageSuccess.bind(this), this.onUpdateFODatesObjectPageError
				.bind(this));
		},

		onUpdateCargoItemPress: function (oEvent) {
			var oFOCargoItem = oEvent.getSource().getBindingContext();
			this.getView().getModel("_SD").setProperty("/SelectedCargoItems", [oFOCargoItem]);
			this.oComponent._CargoItemH.onUpdateCargoItemPress(oEvent);

		},

		onUpdateResourceButtonPress: function (oEvent) {
			var oFOResourceItem = oEvent.getSource().getBindingContext();
			this.getView().getModel("_SD").setProperty("/SelectedResourceItems", [oFOResourceItem]);
			this.oComponent._ResourceH.onUpdateResourcePress(oEvent);
		},
		onCompleteFOPress: function (oEvent) {
			this.oComponent._ExecH.onCompleteFOPress(oEvent.getSource());
		},

		onCancelFOPress: function (oEvent) {
			this.oComponent._ExecH.onCompleteFOPress(oEvent.getSource());
		},

		onDeleteAttachmentPress: function (oEvent) {
			var oFOAttachment = oEvent.getSource().getBindingContext();
			this.getView().getModel("_SD").setProperty("/SelectedAttachments", [oFOAttachment]);
			this.getOwnerComponent()._AttachH.onDeleteAttachmentPress();
		},

		onFetchAttachmentPress: function (oEvent) {
			var oSource = oEvent.getSource();
			this.getOwnerComponent()._AttachH.onFetchAttachmentPress(oSource);

		},
		onUploadAttachmentPress: function (oEvent) {
			this.getOwnerComponent()._AttachH.open(this.getView());
		},

		onUpdateFODatesObjectPageSuccess: function (oEvent) {
			sap.m.MessageToast.show(this.i18n.getProperty("UpdateConfirmedDatesSuccessMessage"));
		},

		onUpdateFODatesObjectPageError: function (oEvent) {
			sap.m.MessageBox.error(this.i18n.getProperty("UpdateConfirmedDatesErrorMessage"), {
				styleClass: "sapUiSizeCompact",
				onClose: null
			});
		},

		onReportExpectedEvent: function (oEvent) {
			this.oComponent._EventH.openReportExpectedEvent(oEvent);
		},

		onReportUnexpectedEvent: function (oEvent) {
			this.oComponent._EventH.openReportUnexpectedEvent(oEvent);
		},

		/**
		 * To set a JSON Model to the view to render the Tree table for cargo items
		 * oStopData contains the binding object with list of all the stops and, 
		 * the items to be loaded and unloaded in each stop
		 */
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
					FreightOrder: oData.FreightOrder ? oData.FreightOrder : "",
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
				tempGrossObj.WeightUnit = oData[i].TranspOrdItemGrossWeightUnit ? oData[i].TranspOrdItemGrossWeightUnit : "";
				tempGrossObj.VolumeUnit = oData[i].TranspOrdItemGrossVolumeUnit ? oData[i].TranspOrdItemGrossVolumeUnit : "";
				tempGrossObj.QuantityUnit = oData[i].TranspOrdItemQuantityUnit ? oData[i].TranspOrdItemQuantityUnit : "";
				//Now the child object contains everything. Push it to the parent's nodes array.
				finalData.push(oTemStopChild);
			}

			return {
				childNode: finalData,
				grossData: tempGrossObj
			};
		},
		/**
		 * On press of the submit button in the cargo items
		 * oEvent contains the context of the table control
		 */
		onPressCargoItemSubmit: function (oEvent) {
			//Payload Creation
			var updatedTableData = this.getView().getModel("CargoTreeModel").getData(); //As this is a JSON Model, two way binding works and we dont have to explicitly get all the changed data from the table
			var payloadArray = []; //Array for the payload
			for (var i = 0; i < updatedTableData.length; i++) {
				if (updatedTableData[i].nodes.length > 0) {
					for (var j = 0; j < updatedTableData[i].nodes.length; j++) {
						//Check if the actual qty (binded to table and changed by user) is equal or not with the original qty stored while preparing the payload (this value comes from the backend)
						if (updatedTableData[i].nodes[j].ActualQuantity !== updatedTableData[i].nodes[j].OldActualQuantity) {
							var tempObj = {
								TransportationOrderItemUUID: updatedTableData[i].nodes[j].TransportationOrderItemUUID,
								TransportationOrderUUID: updatedTableData[i].nodes[j].TransportationOrderUUID
							};
							//Preparing the payload specific to load & unload items
							if (updatedTableData[i].nodes[j].Type === "Load") {
								tempObj.SourceStopUUID = updatedTableData[i].nodes[j].SourceStopUUID;
								tempObj.ActualLoadingQuantity = updatedTableData[i].nodes[j].ActualQuantity;
							} else if (updatedTableData[i].nodes[j].Type === "UnLoad") {
								tempObj.DestinationStopUUID = updatedTableData[i].nodes[j].DestinationStopUUID;
								tempObj.ActualUnloadingQuantity = updatedTableData[i].nodes[j].ActualQuantity;
							}
							//Finally push the temporary object into the array
							payloadArray.push(tempObj);
							//Set the old value with the existing value for actual quantity so that it does not affect the next iteration
							updatedTableData[i].nodes[j].OldActualQuantity = updatedTableData[i].nodes[j].ActualQuantity;
						}
					}
				}
			}
			if (payloadArray.length > 0) {
				//Send the generated payload to the util file to send a update batch call
				this.oComponent._CargoItemHExecution.onSubmitCargoItems(this, payloadArray);
			}

		},

		onHomeLinkPress: function (oEvent) {
			var oHashChanger = HashChanger.getInstance();
			oHashChanger.init();
			oHashChanger.setHash("");
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
				oHashChanger.setHash("FreightOrderExecution/" + _oMDModel.getProperty("/UserInfo/CurrentBusinessPartnerRole"));
			}
		},

		onRefreshObjectView: function () {
			this.getView().getBindingContext().getModel().refresh(true);
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.westernacher.collaborationPortal.fosExecution.WCP_EXECUTION.view.FOExecutionObject
		 */
		// onBeforeRendering: function () {

		// }

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.westernacher.collaborationPortal.fosExecution.WCP_EXECUTION.view.FOExecutionObject
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.westernacher.collaborationPortal.fosExecution.WCP_EXECUTION.view.FOExecutionObject
		 */
		//	onExit: function() {
		//
		//	}

	});

});