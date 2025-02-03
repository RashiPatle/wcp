sap.ui.define([
	"com/westernacher/collaborationPortal/core/util/ParentHandler",
	"sap/m/MessageBox"
], function (ParentHandler, MessageBox) {
	"use strict";

	return ParentHandler.extend("com.westernacher.collaborationPortal.core.util.StopSectionHandler", {

		constructor: function (oController, sItemsPropertyName) {
			this._oResourceBundle = oController.getModel("i18n");
			this._oComponent = oController;
			this._TreeModel = oController.getModel("_TreeItems");
			this._oModel = oController.getModel();
			this.itemsPropertyName = sItemsPropertyName;
		},

		loadStagesDataModel: function (aStages) {
			if (!aStages) {
				return;
			}
			var aStagesTreeStucture = this.prepareStagesTreeStructure(aStages);
			this._TreeModel.setProperty("/to_Stages", aStagesTreeStucture);
		},
		prepareStagesTreeStructure: function (aStages) {
			var oModel = this.getModel();
			var aStagesRestructured = [];
			for (var i = 0; i < aStages.length; i++) {
				// var oStage = {
				// 	"nodes": []
				// };

				var oStageContext = new sap.ui.model.Context(oModel, "/" + aStages[i]);
				var oStage = oStageContext.getObject();
				delete oStage[this.itemsPropertyName];
				delete oStage.__metadata;
				oStage.nodes = [];
				var aItems = oStageContext.getProperty(this.itemsPropertyName);

				for (var j = 0; j < aItems.length; j++) {
					var oItemContext = new sap.ui.model.Context(oModel, "/" + aItems[j]);
					var oItem = oItemContext.getObject();
					delete oItem.__metadata;
					oStage.nodes.push(oItem);
				}
				aStagesRestructured.push(oStage);
			}
			return aStagesRestructured;
		}

	});
});