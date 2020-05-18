import axios from 'axios'
import {categoriesRnc, ressourceTypes} from '@/constants/resources'
import _ from 'lodash'

function getPeriodsForCurrentYear(dates, ressourceType) {
    let periodKeys = [];
    if (ressourceType.isMontantAnnuel) {
        periodKeys.push(dates.lastYear);
        return periodKeys;
    }
    if (ressourceType.id == 'tns_auto_entrepreneur_chiffre_affaires') {
        periodKeys.push(dates.lastYear);
        // periodKeys = periodKeys.concat(_.map(dates.last3Months, 'id'));
        dates.last3Months.forEach(m => periodKeys.push(m))
    } else {
        // periodKeys = periodKeys.concat(_.map(dates.last12Months, 'id'));
        dates.last12Months.forEach(m => periodKeys.push(m))
    }

    if (! ressourceType.revenuExceptionnel) {
        periodKeys.unshift(dates.thisMonth);
    }

    return periodKeys;
}

function getPeriodKeysForCurrentYear(dates, ressourceType) {
    return _.map(getPeriodsForCurrentYear(dates, ressourceType), 'id')
}

function setDefaultValueForCurrentYear(dates, individu, ressourceType) {
    let ressourceId = ressourceType.id;
    individu[ressourceId] = individu[ressourceId] || {};
    let ressource = individu[ressourceId];
    let periodKeys = getPeriodKeysForCurrentYear(dates, ressourceType);

    if (_.some(periodKeys, function(periodKey) { return _.isNumber(ressource[periodKey]); })) {
        return;
    }

    periodKeys.forEach(function(periodKey) {
        ressource[periodKey] = ressource[periodKey] || null;
    });
}

function unsetForCurrentYear(dates, entity, ressourceType) {
    let ressourceId = ressourceType.id;
    entity[ressourceId] = entity[ressourceId] || {};
    let ressource = entity[ressourceId];
    let periodKeys = getPeriodKeysForCurrentYear(dates, ressourceType);
    periodKeys.forEach(function(periodKey) {
        delete ressource[periodKey]
    });

    if (_.isEmpty(ressource)) {
        delete entity[ressourceId]
    }
}

let ressourcesForTrailingMonthsAndFiscalYear = categoriesRnc.filter(function(fiscalRessource) {
    return fiscalRessource.sources && fiscalRessource.sources.indexOf(fiscalRessource.id) >= 0;
}).map(function(fiscalRessource) { return fiscalRessource.id; });

function isSelectedForCurrentYear(ressource, ressourceIdOrType) {
    // A single value means that a SINGLE value has been specified for the FISCAL year
    // Multiple values means that current year values were specified
    if (ressourcesForTrailingMonthsAndFiscalYear.indexOf(ressourceIdOrType.id || ressourceIdOrType) >= 0) {
        return _.keys(ressource).length > 1
    }

    return Boolean(ressource);
}

function getIndividuRessourceTypes(individu) {
    return _.filter(ressourceTypes, isRessourceOnMainScreen)
        .reduce((accumulator, ressourceType) => {
            accumulator[ressourceType.id] = isSelectedForCurrentYear(individu[ressourceType.id], ressourceType)
            return accumulator
        }, {})
}

function setIndividuRessourceTypes(individu, types, dates) {
    let typeMap = _.keyBy(_.filter(ressourceTypes, isRessourceOnMainScreen), 'id');

    Object.keys(types).forEach(function(ressourceTypeId) {
        if (types[ressourceTypeId]) {
            setDefaultValueForCurrentYear(dates, individu, typeMap[ressourceTypeId])
        } else {
            unsetForCurrentYear(dates, individu, typeMap[ressourceTypeId]);
        }
    })
}

function isRessourceOnMainScreen(ressourceOrType) {
    // Make this function robust so that it can be called with a type from the ressourceTypes constant, or just a string.
    let type = ressourceOrType.id || ressourceOrType;
    return type != 'pensions_alimentaires_versees_individu';
}

function getParameterFromOpenfisca(parameterId) {
    return axios.get('/api/openfisca/parameters/' + parameterId)
        .then(function(resp) {
            let values = resp.data.values;
            let sortedByDates = Object.keys(values).sort();
            let latestValue = values[sortedByDates.pop()];
            return latestValue;
        });
}

const Ressource = {
    getPeriodsForCurrentYear,
    // Ne semble pas être utilisée
    // getPeriodKeysForCurrentYear,
    isRessourceOnMainScreen,
    isSelectedForCurrentYear,
    setDefaultValueForCurrentYear,
    getIndividuRessourceTypes,
    setIndividuRessourceTypes,
    unsetForCurrentYear,
    getParameterFromOpenfisca,
}

export default Ressource
