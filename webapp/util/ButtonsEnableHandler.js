sap.ui.define([
	"com/westernacher/collaborationportal/core/util/ParentHandler",
	"sap/m/MessageBox"
], function (ParentHandler, MessageBox) {
	"use strict";

	return ParentHandler.extend("tm.bmc.collaborationportalrefactoring.util.ButtonsEnableHandler", {

		constructor: function (oController, oButtonsConfig) {
			this._oResourceBundle = oController.getModel("i18n");
			this._oController = oController;
			this._oModel = oController.getModel();
			this.oButtonsConfig = oButtonsConfig;

		},
		onTableSelectionChange: function (aTableItemsBindingContexts, oRowContext) {
			var oButtonsModel = this._oController.getModel("_AM");
			//this._setButtonsEnabled(aTableItemsBindingContexts, oRowContext, this.oButtonsConfig, oButtonsModel);
			this._setButtonsEnabled(aTableItemsBindingContexts, this.oButtonsConfig, oButtonsModel);
		},
		onObjectPageSelectionChange: function (oRecord) {
			var oButtonsModel = this._oController.getModel("_AM");
			//this._propertiesOnObjectPage(this.oButtonsConfig, oRecord, oButtonsModel);
			this._setButtonsEnabledObjectPage(this.oButtonsConfig, oRecord, oButtonsModel);
		},
		_setButtonsEnabled: function (aTableItemsBindingContexts, oTableButtons, oButtonsModel) {
			if (aTableItemsBindingContexts.length > 0) { //First check if any record is selected or not in the worklist table
				var oFinalBoolObj = {}; //Create a temporary object to store the statuses
				aTableItemsBindingContexts.forEach(function (oBindingContext) { //Loop for each record that is selected
					var oTableRowData = oBindingContext.getObject();
					var oButtonsModelData = oButtonsModel.getData();
					//Loop for each object within the component's BEH object to check for the property
					Object.keys(oTableButtons).forEach(function (key, index) {
						var oTempConfigObj = oTableButtons[key]; //The particular instance of the config object
						var isEnabled = false; //By default set the enabled to as false
						//Check if the binding context of thr row has the FC property mentioned in the config object
						//Then check if the binding property is available in the buttons model (Control Management model.json) or not
						if (oTableRowData.hasOwnProperty(oTempConfigObj.fieldControlBinding) && oButtonsModelData.hasOwnProperty(oTempConfigObj.propertyBinding)) {
							//Check wether the backend FC property is true or not
							if (oTableRowData[oTempConfigObj.fieldControlBinding]) {
								isEnabled = true;
							}
							//Checking based on no. of items selected
							if (aTableItemsBindingContexts.length === 1) {
								oTempConfigObj.single && isEnabled ?
									isEnabled = true :
									isEnabled = false;
							} else if (aTableItemsBindingContexts.length > 1) {
								oTempConfigObj.multiple && isEnabled ?
									isEnabled = true :
									isEnabled = false;
							}
							//In our temp object check if the property that is being checked is
							//available or not, else assigne it to a empty array
							if (!oFinalBoolObj.hasOwnProperty(oTempConfigObj.propertyBinding)) {
								oFinalBoolObj[oTempConfigObj.propertyBinding] = [];
							}
							//Based on is enabled, push the appropriate value to the array.
							//This takes care of a single instance from the list of items selected
							if (isEnabled && !oTempConfigObj.allStrict) {
								oFinalBoolObj[oTempConfigObj.propertyBinding].push(true);
							} else {
								oFinalBoolObj[oTempConfigObj.propertyBinding].push(false);
							}
						}
					});
				});
				//Now for all the records selected, to enable based on the backend property
				//Loop through the temporary object and check if any of the properties array values contain false
				//If false is there, then set the model property as false
				Object.keys(oFinalBoolObj).forEach(function (key, index) {
					if (oFinalBoolObj[key].length > 0) {
						oFinalBoolObj[key].includes(false) ?
							oButtonsModel.setProperty("/" + key, false) :
							oButtonsModel.setProperty("/" + key, true);
					}
				});
			} else {
				//In case of navigation, filter, other operations on table, the buttons should always remain disabled
				var oButtonModelData = oButtonsModel.getData();
				Object.keys(oButtonModelData).forEach(function (key, index) {
					//Check if the property contains E_A, which means it is a enable property. Then Disable it.
					if (key.includes("E_A")) {
						oButtonsModel.setProperty("/" + key, false);
					}
				});

			}
		},
		_setButtonsEnabledObjectPage: function (oTableButtons, oRecord, oButtonsModel) {
			var oButtonsModelData = oButtonsModel.getData();
			//Loop for each object within the component's BEH object to check for the property
			Object.keys(oTableButtons).forEach(function (key, index) {
				var oTempConfigObj = oTableButtons[key]; //The particular instance of the config object
				var isEnabled = false; //By default set the enabled to as false
				//Check if the binding context of thr row has the FC property mentioned in the config object
				//Then check if the binding property is available in the buttons model (Control Management model.json) or not
				if (oRecord.hasOwnProperty(oTempConfigObj.fieldControlBinding) && oButtonsModelData.hasOwnProperty(oTempConfigObj.propertyBinding)) {
					//Check wether the backend FC property is true or not
					if (oRecord[oTempConfigObj.fieldControlBinding]) {
						isEnabled = true;
					}
					//Based on is enabled, set the appropriate buttons model binding
					if (isEnabled && !oTempConfigObj.allStrict) {
						oButtonsModel.setProperty("/" + oTempConfigObj.propertyBinding, true);
					} else {
						oButtonsModel.setProperty("/" + oTempConfigObj.propertyBinding, false);
					}
				}
			});
		},
		_setButtonsEnabled_OLD: function (aTableItemsBindingContexts, oRowContext, oTableButtons, oButtonsModel) {
			var sMode = "";

			if (aTableItemsBindingContexts.length < 1) {
				sMode = "none";
			} else if (aTableItemsBindingContexts.length === 1) {
				sMode = "single";
			} else {
				sMode = "multiple";
			}
			//Loop threw all table buttons
			jQuery.each(oTableButtons, function (ButtonConfKey, ButtonConf) {
				//If button is not enabled in particular selection mode or has no extra properties to check 
				//property enabled is set based on selection mode
				if (!ButtonConf[sMode] || (ButtonConf[sMode] && !Object.keys(ButtonConf.properties).length)) {
					ButtonConf.enabled = ButtonConf[sMode];
				}
				//If button is enabled in particuler mode and has extra properties to check
				else {
					if (sMode === "none") {
						//If no Table Record is selected, clear all global values
						this._propertiesInNoneMode(ButtonConf);

					} else if (sMode === "single") {
						//If only one Table Record is selected set global values for value independent properties
						//and check if value dependent properties have required value
						this._propertiesInSingleMode(ButtonConf, oRowContext, aTableItemsBindingContexts);

					} else if (sMode === "multiple") {
						//If many Table Records are selected compare global value (first selected) for value independent properties
						//and loop threw value dependent properties and check if have required value
						this._propertiesInMultipleMode(ButtonConf, oRowContext, aTableItemsBindingContexts);
					}
				}
				oButtonsModel.setProperty(ButtonConf.propertyBinding, ButtonConf.enabled);
			}.bind(this));
		},
		_propertiesInNoneMode: function (ButtonConf) {
			// jQuery.each(ButtonConf.properties, function(ContextPropertyKey, ContextProperty) {

			// 	if (ContextProperty === "") {
			// 		this[ContextPropertyKey] = null;
			// 	}
			// }.bind(this));
		},
		_propertiesInSingleMode: function (ButtonConf, oRowContext, aTableItemsBindingContexts) {
			var isEnabled = true;

			jQuery.each(ButtonConf.properties, function (ContextPropertyKey, ContextProperty) {
				//	var sPropertyBinding = ButtonConf.propertiesBinding[ContextPropertyKey];
				// var bBindingValue = this._oAuthModel.getProperty(sPropertyBinding);
				// if (!bBindingValue) {
				// 	return false;
				// }
				var anyValue = false;
				for (var i = 0; i < ContextProperty.length; i++) {
					if (ContextProperty[i] !== "") { //Check if BEH property from component of modules is coming as empty string
						jQuery.each(aTableItemsBindingContexts, function (iKey, oIndexRowContext) { //If not, then loop through each value mentioned for a single property
							if (oIndexRowContext && String(ContextProperty[i]).substring(0, 1) === "!") { //Check if not equals is there for a particular value of the property
								if (String(oIndexRowContext.getProperty(ContextPropertyKey)) === String(ContextProperty[i]).substring(1)) { //Check if the backend value of the property is same as the property value mentioned in the component minus the !
									isEnabled = false;
									return false;
								} else {
									if (ContextProperty.length > 1) {
										anyValue = true;
									}
								}

							} else {
								if (oIndexRowContext && oIndexRowContext.getProperty(ContextPropertyKey) !== ContextProperty[i]) {
									isEnabled = false;
									return false;
								} else {
									if (ContextProperty.length > 1) {
										anyValue = true;
									}
								}
							}
						});
						//Multiple Not equals value (from component button enable config), as it is not breaking properly, check if enabled is false and if the context property contains not equals
						if (!isEnabled && String(ContextProperty[i]).substring(0, 1) === "!") {
							return false;
						}
					}

				}
				if (anyValue && !ButtonConf.allStrict) {
					isEnabled = true;
				}
			}.bind(this));
			ButtonConf.enabled = isEnabled;
		},
		_propertiesInMultipleMode: function (ButtonConf, oRowContext, aTableItemsBindingContexts) {
			var isEnabled = true;
			var oInitialContext = aTableItemsBindingContexts[0];
			jQuery.each(ButtonConf.properties, function (ContextPropertyKey, ContextProperty) {

				var anyValue = [];
				for (var i = 0; i < ContextProperty.length; i++) {
					if (ContextProperty[i] === "") {
						jQuery.each(aTableItemsBindingContexts, function (iKey, oIndexRowContext) {
							if (oIndexRowContext && oIndexRowContext.getProperty(ContextPropertyKey) !== oInitialContext.getProperty(ContextPropertyKey)) {
								isEnabled = false;
								return false;
							}
						}.bind(this));
						if (!isEnabled) {
							return false;
						}
					} else {
						jQuery.each(aTableItemsBindingContexts, function (IndexKey, oIndexRowContext) {
							if (typeof anyValue[IndexKey] === "undefined") {
								anyValue[IndexKey] = false;
							}
							if (String(ContextProperty[i]).substring(0, 1) === "!") {
								if (oIndexRowContext && String(oIndexRowContext.getProperty(ContextPropertyKey)) === String(ContextProperty[i]).substring(
										1)) {
									isEnabled = false;
									//	return false;
								} else {
									anyValue[IndexKey] = true;
								}
							} else {
								if (oIndexRowContext && oIndexRowContext.getProperty(ContextPropertyKey) !== ContextProperty[i]) {
									isEnabled = false;
								} else {
									anyValue[IndexKey] = true;
								}
							}
						}.bind(this));
						//Modified the code to accomodate multiple not equals values (Earlier only
						//upto context prop. length === 1) now added an or with new condition
						if (!isEnabled && (ContextProperty.length === 1 || String(ContextProperty[i]).substring(0, 1) === "!")) {
							return false;
						}
						if (!ButtonConf.allStrict) {
							var checkAnyValues = true;
							jQuery.each(anyValue, function (key, val) {
								if (!val) {
									checkAnyValues = false;
									isEnabled = false;
									return false;
								}
							});
							if (checkAnyValues) {
								isEnabled = true;
							}
						}

					}

				}

			}.bind(this));
			ButtonConf.enabled = isEnabled;
		},
		_propertiesOnObjectPage: function (oTableButtons, oRecord, oButtonsModel) {
			jQuery.each(oTableButtons, function (ButtonConfKey, ButtonConf) {
				var isEnabled = true;
				jQuery.each(ButtonConf.properties, function (ContextPropertyKey, ContextProperty) {

					var anyValue = false;
					for (var i = 0; i < ContextProperty.length; i++) {
						if (ContextProperty[i] !== "") {
							if (oRecord && String(ContextProperty[i]).substring(0, 1) === "!") {
								if (String(oRecord[ContextPropertyKey]) === String(ContextProperty[i]).substring(1)) {
									isEnabled = false;
								} else {
									if (ContextProperty.length > 1) {
										anyValue = true;
									}
								}
							} else {
								if (oRecord && oRecord[ContextPropertyKey] !== ContextProperty[i]) {
									isEnabled = false;
								} else {
									if (ContextProperty.length > 1) {
										anyValue = true;
									}
								}
							}
						}
						//Multiple Not equals value (from component button enable config), as it is not breaking properly, check if enabled is false and if the context property contains not equals
						if (!isEnabled && String(ContextProperty[i]).substring(0, 1) === "!") {
							return false;
						}
					}
					if (anyValue && !ButtonConf.allStrict) {
						isEnabled = true;
					}
				}.bind(this));
				ButtonConf.enabled = isEnabled;
				oButtonsModel.setProperty(ButtonConf.propertyBinding, ButtonConf.enabled);
			}.bind(this));
		}

	});
});