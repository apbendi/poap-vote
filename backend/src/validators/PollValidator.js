import SignatureHelpers from "../utils/SignatureHelpers";
import isValidAddress from "../utils/isValidAddress";

class PollValidator {

    static validateCreate(pollData, eventsData) {
        const fieldValidation = this.validateFields(pollData);
        if (!fieldValidation.isValid) {
            return fieldValidation;
        }

        const dateValidation = this.validateEndDate(pollData);
        if(!dateValidation.isValid) {
            return dateValidation;
        }

        if (!isValidAddress(pollData.polltaker_account)) {
            return {
                isValid: false,
                errorMessage: "Ethereum address is improperly formed",
            }
        }

        const optionsValidation = this.validatePollOptions(pollData.poll_options);
        if (!optionsValidation.isValid) {
            return optionsValidation;
        }

        const eventsValidation = this.validateEvents(pollData.valid_event_ids, eventsData);
        if (!eventsValidation.isValid) {
            return eventsValidation;
        }

        const signatureValidation = this.validateSignature(pollData);
        if (!signatureValidation.isValid) {
            return signatureValidation;
        }

        return {
            isValid: true,
            errorMessage: null,
        }
    }

    static validateFields(pollData) {
        const required_fields = ["title", "polltaker_account", "description",
                                "end_date", "valid_event_ids", "poll_options", "attestation"];

        for (let i = 0; i < required_fields.length; i++) {
            const field = required_fields[i];

            if (!pollData[field]) {
                return {
                    isValid: false,
                    errorMessage: "Missing required poll data fields",
                };
            }
        }

        return {
            isValid: true,
            errorMessage: null,
        };
    }

    static validateEndDate(pollData) {
        const y2kInMilliseconds = 946684800000;

        if (!pollData.end_date) {
            return {
                isValid: true,
                errorMessage: null,
            };
        }

        if ("number" !== typeof pollData.end_date || pollData.end_date > y2kInMilliseconds) {
            return {
                isValid: false,
                errorMessage: "Poll end date should be a number in seconds since Unix epoch",
            };
        }

        let now = Math.floor(Date.now() / 1000);
        let validEnd = now + (24 * 60 * 60);

        if (pollData.end_date < validEnd) {
            return {
                isValid: false,
                errorMessage: "Poll end date must be at least 1 day in the future",
            };
        }

        return {
            isValid: true,
            errorMessage: null,
        };
    }

    static validatePollOptions(pollOptions) {
        if (!pollOptions.length || pollOptions.length < 2 || pollOptions.length > 20) {
            return {
                isValid: false,
                errorMessage: "Poll must have between 2 and 20 options",
            };
        }

        for (let i = 0; i < pollOptions.length; i++) {
            const option = pollOptions[i];

            if ('string' !== (typeof option) || option.length < 1) {
                return {
                    isValid: false,
                    errorMessage: "Poll Option contents are missing or malformed",
                };
            }
        }

        return {
            isValid: true,
            errorMessage: null,
        };
    }

    static validateEvents(eventIds, eventsData) {
        const allIds = eventsData.map((event) => { return event.id });

        for (let i = 0; i < eventIds.length; i++) {
            const eventId = eventIds[i];

            if (!allIds.includes(eventId)) {
                return {
                    isValid: false,
                    errorMessage: `Invalid ID in qualifying events ${eventId}`,
                };
            }
        }

        return {
            isValid: true,
            errorMessage: null,
        };
    }

    static validateSignature(pollData) {
        const signature = pollData.attestation;

        if (130 !== signature.length) {
            return {
                isValid: false,
                errorMessage: "Improperly formed signature",
            };
        }

        let digestPollData = {...pollData};
        delete digestPollData.attestation

        const dataName = 'Poll';
        const dataFormat = [
            { name: 'title', type: 'string' },
            { name: 'polltaker_account', type: 'address' },
            { name: 'description', type: 'string' },
            { name: 'valid_event_ids', type: 'uint256[]' },
            { name: 'poll_options', type: 'string[]' },
            { name: 'end_date', type: 'string' },
          ];

        const recoveredAddress = SignatureHelpers.recoverSigner(signature, dataName, dataFormat, digestPollData)

        if (recoveredAddress !== pollData.polltaker_account) {
            return {
                isValid: false,
                errorMessage: "Signature does not match the data submitted",
            }
        }

        return {
            isValid: true,
            errorMessage: null,
        }
    }
}

export default PollValidator;
