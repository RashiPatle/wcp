sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function (UI5Object, MessageBox, MessageToast) {
	"use strict";

	return UI5Object.extend("com.westernacher.collaborationportal.core.util.ActionHandler", {

		constructor: function (oController, oButtonsConfig) {
			this._oResourceBundle = oController.getModel("i18n");
			this._oComponent = oController;
			this._oActionModel = oController.getModel('_AM');
			this._oPropertiesModel = oController.getModel('_PM');
			this._buttonsConfig = oButtonsConfig;
			// this._oActionModel.setProperty("/QUOTE", {
			// 	'serviceURL': sService
			// });
		},
		checkUserRoleMetaModel: function (oModel, sRole) {
			var sCurrentRole = this._oActionModel.getProperty("/Role");

			if (!sCurrentRole || sCurrentRole !== sRole) {

				this._oActionModel.setProperty("/Role", sRole);
				this._prepareMetadataModel(oModel);
			}
		},
		checkUserRoleMetaModelForEntity: function (oModel, sRole, sEntityName) {
			var sCurrentRole = this._oActionModel.getProperty("/Role");
			if (this._oPropertiesModel.getProperty("/" + sEntityName)) {
				var oEntityProperties = this._oPropertiesModel.getProperty("/" + sEntityName);
			}

			if (!sCurrentRole || sCurrentRole !== sRole || !oEntityProperties) {
				this._prepareMetadataModelForEntity(oModel, sEntityName);
				this._oActionModel.setProperty("/Role", sRole);
			}
		},
		_prepareMetadataModel: function (oModel) {
			var oMetaModel = oModel.getMetaModel();
			try {
				var oEntityContainer = oMetaModel.getODataEntityContainer();
				var aEntitySets = oEntityContainer.entitySet;

				var aEntitySetsSubset = [];
				for (var j = 0; j < aEntitySets.length; j++) {
					aEntitySetsSubset.push({
						name: aEntitySets[j].name,
						entityType: aEntitySets[j].entityType
					});
				}
				var aFunctionImports = oEntityContainer.functionImport;
				if (aEntitySetsSubset) {
					for (var i = 0; i < aEntitySets.length; i++) {
						this._assignEntityRestrictions(aEntitySets[i]);
					}
				}
				if (aFunctionImports) {
					for (var j = 0; j < aFunctionImports.length; j++) {
						this._assignFunctionImportsInfo(aFunctionImports[j], aEntitySetsSubset);
					}
				}
				this._checkVisibilityForButtons();
			} catch (e) {
				return;
			}
		},
		_prepareMetadataModelForEntity: function (oModel, sEntitySet) {
			if (!sEntitySet || !oModel) {
				return;
			}
			var oMetaModel = oModel.getMetaModel();
			try {
				var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
				var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
				var aProperties = oEntityType.property;
				var aAssociations = oEntityType.navigationProperty;
				var oProperties = {};
				jQuery.each(aProperties, function (key, val) {
					oProperties[val.name] = true;
				});
				this._assignEntitySetPropertiesInfo(sEntitySet, oProperties);

				for (var i = 0; i < aAssociations.length; i++) {
					this._assignAssociationSetPropertiesInfo(aAssociations[i].name);
				}

			} catch (e) {
				return;
			}
		},
		_assignEntityRestrictions: function (oEntitySet) {
			//Setting the values of creatable, updatable & deletable safely from the metadata based on roles
			var sCurrentRole = this._oActionModel.getProperty("/Role");
			var sCreatableMetadata = "sap:" + sCurrentRole + ".creatable";
			var sDelelableMetadata = "sap:" + sCurrentRole + ".deletable";
			var sUpdatableMetadata = "sap:" + sCurrentRole + ".updatable";
			var oRestrictions = {
				creatable: oEntitySet[sCreatableMetadata] ? JSON.parse(oEntitySet[sCreatableMetadata]) : true,
				deletable: oEntitySet[sDelelableMetadata] ? JSON.parse(oEntitySet[sDelelableMetadata]) : true,
				updatable: oEntitySet[sUpdatableMetadata] ? JSON.parse(oEntitySet[sUpdatableMetadata]) : true
			};

			// var oRestrictions = {
			// 	creatable: oEntitySet["sap:creatable"] ? JSON.parse(oEntitySet["sap:creatable"]) : true,
			// 	deletable: oEntitySet["sap:deletable"] ? JSON.parse(oEntitySet["sap:deletable"]) : true,
			// 	updatable: oEntitySet["sap:updatable"] ? JSON.parse(oEntitySet["sap:updatable"]) : true
			// };

			this._oActionModel.setProperty("/" + oEntitySet.name, oRestrictions);
			this._oActionModel.setProperty("/V_" + oEntitySet.name, true);
		},
		_assignFunctionImportsInfo: function (oFunctionImport, aEntitySetsSubset) {
			var oFunctionImportConverted = {};
			oFunctionImportConverted.name = oFunctionImport.name;
			oFunctionImportConverted.httpMethod = oFunctionImport.httpMethod;
			oFunctionImportConverted.entityType = oFunctionImport["sap:action-for"];
			for (var i = 0; i < aEntitySetsSubset.length; i++) {
				if (aEntitySetsSubset[i]["entityType"] === oFunctionImportConverted.entityType) {
					oFunctionImportConverted.entitySet = aEntitySetsSubset[i]["name"];
				}
			}
			oFunctionImportConverted.parameter = oFunctionImport.parameter;
			if (oFunctionImportConverted.entitySet) {
				this._oActionModel.setProperty("/" + oFunctionImportConverted.entitySet + "/" + oFunctionImportConverted.name,
					oFunctionImportConverted);
			}
		},
		_assignEntitySetPropertiesInfo: function (sEntitySet, oProperties) {
			this._oPropertiesModel.setProperty("/" + sEntitySet, oProperties);
		},
		_assignAssociationSetPropertiesInfo: function (sAssocitionName) {
			this._oPropertiesModel.setProperty("/V_" + sAssocitionName, true);
		},
		_checkVisibilityForButtons: function () {
			var oEntities = this._oActionModel.getProperty("/");
			jQuery.each(this._buttonsConfig, function (key, val) {
				var oRestriction = oEntities[val.entitySet][val.restriction];
				var bValidation = oRestriction ? true : false;
				this._oActionModel.setProperty("/" + val.propertyBinding, bValidation);
			}.bind(this));
		},

		onActionNoInputPress: function (aSelectedItems, oButton, fnSuccess, fnError, oModel) {
			var oCustomData = oButton.data();
			var sEntitySet = oCustomData.entitySet;
			var sActionName = oCustomData.actionName;
			var oFunctionImportInfo = this._oActionModel.getProperty("/" + sEntitySet + "/" + sActionName);
			var aFunctionImportParameters = oFunctionImportInfo.parameter;
			for (var i = 0; i < aSelectedItems.length; i++) {
				var oParametersValueToSend = {};
				for (var j = 0; j < aFunctionImportParameters.length; j++) {
					var oParameter = aFunctionImportParameters[j];
					oParametersValueToSend[oParameter.name] = aSelectedItems[i].getProperty(oParameter.name);
				}
				this._callFunctionImport("/" + sActionName, oFunctionImportInfo.httpMethod,
					oParametersValueToSend, fnSuccess, fnError, oModel);
			}
		},

		onActionWithInputPress: function (oTable, oButton) {},

		_callFunctionImport: function (sName, sHTTPMethod, oParameters, fnSuccess, fnError, oModel) {
			if (!oModel) {
				oModel = this._oComponent.getModel();
			}
			oModel.callFunction(sName, {
				method: sHTTPMethod,
				urlParameters: oParameters,
				success: function (oResp, oData) {
					MessageToast.show(oResp.message);
					if (fnSuccess) {
						fnSuccess(oResp, oData);
					}
				}.bind(this),
				error: function (oErr) {
					this._oComponent.ownerComponent._oErrorHandler.callMultipleErrorDialog(oErr);
					if (fnError) {
						fnError();
					}
				}.bind(this)
			});
		}

	});
});