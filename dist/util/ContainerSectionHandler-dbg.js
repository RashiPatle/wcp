sap.ui.define([
	"com/westernacher/collaborationportal/core/util/ParentModuleHandler",
	"com/westernacher/collaborationportal/core/util/ParentHandler",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"com/westernacher/collaborationportal/core/model/formatter"
], function (ParentModuleHandler, ParentHandler, MessageBox, MessageToast, formatter) {

	return ParentModuleHandler.extend("com.westernacher.collaborationportal.core.util.ContainerSectionHandler", {
		ContainerUpdateDialogId: 'idUpdateContainerItemDialog',

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

		onUpdateContainerPress: function (oEvent) {
			if (!this.oUpdateContainerDialog) {
				var oFragment = sap.ui.xmlfragment(this.ContainerUpdateDialogId,
					"com.westernacher.collaborationportal.core.fragment.sections.UpdateContainer",
					this);
				var oDedicatedModels = [];
				var oResourceContext = oEvent.getSource().getBindingContext();
				this.oUpdateContainerDialog = oFragment;
				oDedicatedModels.push({
					model: oResourceContext.getModel()
				});
				this._bindModelsToFragment(this.oUpdateContainerDialog, oDedicatedModels);
				this._bindItemDataToFragment(this._oComponent.getModel("_SD").getProperty("/SelectedContainers"), this.oUpdateContainerDialog);
				this.oUpdateContainerDialog.open();
			}
		},

		onUpdateContainerConfirmed: function () {
			var oContainerNumber = sap.ui.getCore().byId(this.ContainerUpdateDialogId + "--idEditContainerNumber");
			var sContainerNumber = oContainerNumber.getValue();

			var oGrossWeight = sap.ui.getCore().byId(this.ContainerUpdateDialogId + "--idEditGrossWeight");
			var sGrossWeight = formatter.customCurrencyParser(oGrossWeight.getValue());

			var sGrossWeightUoM = sap.ui.getCore().byId(this.ContainerUpdateDialogId + "--idEditGrossWeightUoM").getValue();

			var oGrossVolume = sap.ui.getCore().byId(this.ContainerUpdateDialogId + "--idEditGrossVolume");
			var sGrossVolume = formatter.customCurrencyParser(oGrossVolume.getValue());

			var sGrossVolumeUoM = sap.ui.getCore().byId(this.ContainerUpdateDialogId + "--idEditGrossVolumeUoM").getValue();

			var oFO = this._oComponent.getModel("_SD").getProperty("/SelectedItems");
			var aFOContainers = this._oComponent.getModel("_SD").getProperty("/SelectedContainers");

			// if (sContainerNumber == aFOContainers[0].oModel.getProperty(aFOContainers[0].sPath).ContainerNumber) {
			// 	return;
			// }

			for (var i = 0; i < aFOContainers.length; i++) {
				var payLoad = {
					// "FreightBookingID": oFO[0].oModel.getProperty(oFO[0].sPath).FreightBookingID,
					"TransportationOrderUUID": oFO[0].oModel.getProperty(oFO[0].sPath).TransportationOrderUUID,
					"to_Items": [{
						// "TranspOrdItem": aFOContainers[i].oModel.getProperty(aFOContainers[i].sPath).TranspOrdItem,
						"TransportationOrderItemUUID": aFOContainers[i].oModel.getProperty(aFOContainers[i].sPath).TransportationOrderItemUUID,
						"ContainerNumber": sContainerNumber,
						"TranspOrdItemGrossWeight": sGrossWeight,
						"TranspOrdItemGrossWeightUnit": sGrossWeightUoM,
						"TranspOrdItemGrossVolume": sGrossVolume,
						"TranspOrdItemGrossVolumeUnit": sGrossVolumeUoM,
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
							this.onUpdateContainerCancel();
						}
					}.bind(this),
					error: function (oErr) {
						MessageBox.error("Update failed!");
						this.onUpdateContainerCancel();
					}.bind(this)
				});
			}

		},

		onUpdateContainerCancel: function () {
			this.oUpdateContainerDialog.close();
		},

		afterCloseUpdateContainerDialog: function () {
			this.oUpdateContainerDialog.destroy();
			this.oUpdateContainerDialog = null;
		},

		formattingAmountsInLocale: function (oEvent) {
			formatter.convertPriceInLocaleFormat(oEvent);
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