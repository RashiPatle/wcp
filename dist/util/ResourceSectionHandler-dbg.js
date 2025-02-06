sap.ui.define([
	"com/westernacher/collaborationportal/core/util/ParentModuleHandler",
	"com/westernacher/collaborationportal/core/util/ParentHandler",
	"com/westernacher/collaborationportal/core/util/ErrorHandler",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function (ParentModuleHandler, ParentHandler, ErrorHandler, MessageBox, MessageToast) {

	return ParentModuleHandler.extend("com.westernacher.collaborationportal.core.util.ResourceSectionHandler", {
		ResourceUpdateDialogId: 'idUpdateResourceDialog',

		constructor: function (oController, sEntitySetName) {
			this._oResourceBundle = oController.getModel("i18n");
			this._oResourceBundleHome = oController.getModel("i18nhome");
			this._oComponent = oController;
			this._oActionModel = oController.getModel("_AM");
			this._oSelectedFOModel = oController.getModel("_SD");
			this._MD = oController._MD;
			this.sEntitySetName = sEntitySetName;
		},

		onUpdateResourcePress: function (oEvent) {
			if (!this.oUpdateResourceDialog) {
				var oFragment = sap.ui.xmlfragment(this.ResourceUpdateDialogId,
					"com.westernacher.collaborationportal.core.fragment.sections.UpdateResource",
					this);
				var oDedicatedModels = [];	
				var oResourceContext = oEvent.getSource().getBindingContext();
				this.oUpdateResourceDialog = oFragment;
				oDedicatedModels.push({
					model: oResourceContext.getModel()
				});
				this._bindModelsToFragment(this.oUpdateResourceDialog, oDedicatedModels);
				
				this._bindItemDataToFragment(this._oComponent.getModel("_SD").getProperty("/SelectedResourceItems"), this.oUpdateResourceDialog);
				// Setting existing plate number
				var oPlateNumber = sap.ui.getCore().byId(this.ResourceUpdateDialogId + "--idPlateNumber");
				var oSelectedResourceItems = this._oSelectedFOModel.getProperty("/SelectedResourceItems");
				if (oSelectedResourceItems.length > 0) {
					var sSelectedResourceItemsPath = oSelectedResourceItems[0].getPath();
					oPlateNumber.setValue(oSelectedResourceItems[0].getObject(sSelectedResourceItemsPath).PlateNumber);
				}
				this.oUpdateResourceDialog.open();
			}
		},

		onUpdateResourceConfirmed: function () {
			var oPlateNumber = sap.ui.getCore().byId(this.ResourceUpdateDialogId + "--idPlateNumber");
			var oCountry = sap.ui.getCore().byId(this.ResourceUpdateDialogId + "--idCountry");

			var sPlateNumber = oPlateNumber.getValue();
			var sCountry = oCountry.getValue();

			var oFO = this._oComponent.getModel("_SD").getProperty("/SelectedItems");
			var aFOResourceItem = this._oComponent.getModel("_SD").getProperty("/SelectedResourceItems");
			if ((sPlateNumber === aFOResourceItem[0].oModel.getProperty(aFOResourceItem[0].sPath).PlateNumber)) {
				var sPreviousCountryValue = aFOResourceItem[0].oModel.getProperty(aFOResourceItem[0].sPath).Country;
				if ((!sCountry && !sPreviousCountryValue) || (sCountry === sPreviousCountryValue)) {
					this.onUpdateResourceCancel();
					return;
				}
			}

			for (var i = 0; i < aFOResourceItem.length; i++) {
				var payLoad = {
					"FreightOrder": oFO[0].oModel.getProperty(oFO[0].sPath).FreightOrder,
					"TransportationOrderUUID_F": oFO[0].oModel.getProperty(oFO[0].sPath).TransportationOrderUUID_F,
					"to_Items": [{
						"TranspOrdItem": aFOResourceItem[i].oModel.getProperty(aFOResourceItem[i].sPath).TranspOrdItem,
						"TransportationOrderItemUUID": aFOResourceItem[i].oModel.getProperty(aFOResourceItem[i].sPath).TransportationOrderItemUUID,
						"PlateNumber": sPlateNumber,
						"Country": sCountry
					}]
				};
				var thatMessageToast = MessageToast;
				this.getModel().create(this.sEntitySetName, payLoad, {
					success: function (oData, oRes) {
						if (oRes.statusCode == "201") {
							thatMessageToast.show((this._getI18nHomeText("resourceMsgUpdate")));
							oFO[0].oModel.read(oFO[0].sPath, {
								urlParameters: {
									"$expand": "to_Items"
								},
							});
							this.onUpdateResourceCancel();
						}
					}.bind(this),
					error: function (oErr) {
						this._oComponent.ownerComponent._oErrorHandler.callMultipleErrorDialog(oErr);
						this.onUpdateResourceCancel();
					}.bind(this)
				});
			}

		},

		onUpdateResourceCancel: function () {
			this.oUpdateResourceDialog.close();
		},

		afterCloseUpdateResourceDialog: function () {
			this.oUpdateResourceDialog.destroy();
			this.oUpdateResourceDialog = null;
		},

		onInnerControlsCreated: function (oEvent) {
			oEvent.getParameters()[0].setValueHelpOnly(true);
		},
		/** 
		 * Returns i18nhome text
		 * @private 
		 * @param {string} [sI18nText] The i18n home text
		 * @returns
		 */
		_getI18nHomeText: function (sI18nText) {
			return this._oResourceBundleHome.getResourceBundle().getText(sI18nText);
		}
	});

});