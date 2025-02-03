sap.ui.define([
	"com/westernacher/collaborationPortal/core/util/ParentModuleHandler",
	"com/westernacher/collaborationPortal/core/util/ParentHandler",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"com/westernacher/collaborationPortal/core/model/formatter",
	"com/westernacher/collaborationPortal/core/util/ErrorHandler"
], function (ParentModuleHandler, ParentHandler, MessageBox, MessageToast, formatter, ErrorHandler) {

	return ParentModuleHandler.extend("com.westernacher.collaborationPortal.core.util.CargoItemExecutionSectionHandler", {

		formatter: formatter,

		constructor: function (oComponent) {
			this._oComponent = oComponent;
			this._oModel = oComponent.getModel();
		},
		/*
		 *Function to submit cargo items to the backend
		 * argument that - contains scope of the calling controller and view
		 *          payloadArray - contains the objects within a array that is to be sent to the backend for updation
		 */
		onSubmitCargoItems: function (that, payloadArray) {

			var oModel = that.getView().getModel();
			oModel.sDefaultUpdateMethod = "PUT";

			oModel.setDeferredGroups(["updateCargo"]);

			var mParameters = {
				groupId: "updateCargo"
			};

			for (var b = 0; b < payloadArray.length; b++) {
				oModel.update("/ZWCP_C_ExecCargoItems(guid'" + payloadArray[b].TransportationOrderItemUUID + "')", payloadArray[b], mParameters);
			}

			oModel.submitChanges({
				groupId: mParameters.groupId,
				success: function (oData) {
					if (oData.__batchResponses.length > 0) {
						//if update operation successfull
						if (oData.__batchResponses[0].hasOwnProperty('__changeResponses')) {
							MessageBox.success(
								"All items successfully updated !", {
									title: "Success"
								});
						} else { //Else display error messagebox
							this._oComponent.ownerComponent._oErrorHandler.callMultipleErrorDialog(oData.__batchResponses[0]);
						}
					}
					that.getView().getModel().sDefaultUpdateMethod = "MERGE";
				}.bind(this),
				error: function (oErr) {

				}
			});
		}

	});

});