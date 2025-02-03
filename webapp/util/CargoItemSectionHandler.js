sap.ui.define([
	"com/westernacher/collaborationPortal/core/util/ParentModuleHandler",
	"com/westernacher/collaborationPortal/core/util/ParentHandler",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"com/westernacher/collaborationPortal/core/model/formatter"
], function (ParentModuleHandler, ParentHandler, MessageBox, MessageToast, formatter) {

	return ParentModuleHandler.extend("com.westernacher.collaborationPortal.core.util.CargoItemSectionHandler", {
		cargoItemUpdateDialogId: 'idUpdateCargoItemDialog',

		formatter: formatter,

		constructor: function (oController, sEntitySetName) {
			this._oResourceBundle = oController.getModel("i18n");
			this._oResourceBundleHome = oController.getModel("i18nhome");

			this._oComponent = oController;
			this._oActionModel = oController.getModel("_AM");
			this._oSelectedFOModel = oController.getModel("_SD");
			this._MD = oController._MD;
			this.sEntitySetName = sEntitySetName;
		},

		onUpdateCargoItemPress: function (oEvent) {
			if (!this.oUpdateCargoItemDialog) {
				var oFragment = sap.ui.xmlfragment(this.cargoItemUpdateDialogId,
					"com.westernacher.collaborationPortal.core.fragment.sections.UpdateCargoItem",
					this);
				var oDedicatedModels = [];	
				var oResourceContext = oEvent.getSource().getBindingContext();
				this.oUpdateCargoItemDialog = oFragment;
				oDedicatedModels.push({
					model: oResourceContext.getModel()
				});
				this._bindModelsToFragment(this.oUpdateCargoItemDialog, oDedicatedModels);
				this._bindItemDataToFragment(this._oComponent.getModel("_SD").getProperty("/SelectedCargoItems"), this.oUpdateCargoItemDialog);
				this.oUpdateCargoItemDialog.open();
			}
		},

		onUpdateCargoItemConfirmed: function () {
			var oQuantityInput = sap.ui.getCore().byId(this.cargoItemUpdateDialogId + "--idEditQuantity");
			var fNewQuantity = oQuantityInput.getValue();

			var oFO = this._oComponent.getModel("_SD").getProperty("/SelectedItems");
			var aFOCargoItems = this._oComponent.getModel("_SD").getProperty("/SelectedCargoItems");

			if (fNewQuantity == aFOCargoItems[0].oModel.getProperty(aFOCargoItems[0].sPath).TranspOrdItemQuantity) {
				return;
			}

			for (var i = 0; i < aFOCargoItems.length; i++) {
				var payLoad = {
					"FreightOrder": oFO[0].oModel.getProperty(oFO[0].sPath).FreightOrder,
					"to_Items": [{
						"TranspOrdItem": aFOCargoItems[i].oModel.getProperty(aFOCargoItems[i].sPath).TranspOrdItem,
						"TransportationOrderItemUUID": aFOCargoItems[i].oModel.getProperty(aFOCargoItems[i].sPath).TransportationOrderItemUUID,
						"TranspOrdItemQuantity": fNewQuantity,
						"TranspOrdItemQuantityUnit": aFOCargoItems[i].oModel.getProperty(aFOCargoItems[i].sPath).TranspOrdItemQuantityUnit
					}]
				};
				this.getModel().create(this.sEntitySetName, payLoad, {
					success: function (oData, oRes) {
						if (oRes.statusCode == "201") {
							MessageToast.show(this._getI18nHomeText("newQtyMsgUpdate"));
							oFO[0].oModel.read(oFO[0].sPath, {
								urlParameters: {
									"$expand": "to_Items"
								},
							});
							this.onUpdateCargoItemCancel();
						}
					}.bind(this),
					error: function (oErr) {
						MessageBox.error("Quantity could not be updated.");
						this.onUpdateCargoItemCancel();
					}.bind(this)
				});
			}

		},

		onUpdateCargoItemCancel: function () {
			this.oUpdateCargoItemDialog.close();
		},

		afterCloseUpdateCargoItemDialog: function () {
			this.oUpdateCargoItemDialog.destroy();
			this.oUpdateCargoItemDialog = null;
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