var codebrag = codebrag || {};

/**
 *
 * Collection of object backed by async operations
 * Maintains immutable reference to collection of elements
 * Loading and removing elements is based on promises.
 *
 * Used to commits and followups to keep server state in sync with local view
 *
 */
codebrag.AsyncCollection = function() {

    // initialize with empty elements list
    this.elements = [];

};

codebrag.AsyncCollection.prototype = {

    /**
     * Adds elements from array returned by a promise callback.
     * @param promise a promise of returning an array.
     * @returns a promise of filling this collection with elements from array.
     */

    appendElements: function(elements) {
        Array.prototype.push.apply(this.elements, elements);
    },

    /**
     * Fills collection with elements returned by a promise.
     * @param promise a promise which should return an array of elements.
     * @returns a promise of array of elements loaded into this collection.
     */
    loadElements: function (promise) {
        var self = this;
        return promise.then(function(receivedCollection) {
            self.replaceWith(receivedCollection);
            return self.elements;
        });
    },

    replaceWith: function(receivedCollection) {
        this.elements.length = 0;
        Array.prototype.push.apply(this.elements, receivedCollection);
    },

    /**
     * Removes element matching gives criteria in matchFn. Removal operation will be performed
     * asynchronously and chained to given promise (for example a server response promise).
     * @param matchFn matching function taking single element and returning true or false if it matches criteria.
     * @param promise of call which should be succeeded by removing element.
     * @returns a promise of removing matching element and returning index of that element.
     */
    removeElement: function(matchFn, promise) {
        var self = this;
        return promise.then(function() {
            var indexToRemove = self._indexOf(matchFn);
            self.elements.splice(indexToRemove, 1);
            return indexToRemove;
        });
    },

    /**
     * Removes element matching gives criteria in matchFn. Removal operation will be performed
     * asynchronously and chained to given promise (for example a server response promise).
     * @param matchFn matching function taking single element and returning true or false if it matches criteria.
     * @param promise of call which should be succeeded by removing element.
     * @returns a promise of removing matching element and returning element on same index after removing.
     */
    removeElementAndGetNext: function(matchFn, promise) {
        var self = this;
        return this.removeElement(matchFn, promise).then(function(indexRemoved) {
            return self.getElementOrNull(indexRemoved);
        });
    },

    _indexOf: function(matchFn) {
        var self = this;
        var found = _.find(self.elements, function(current) {
            return matchFn(current);
        });
        return self.elements.indexOf(found);
    },

    /**
     * Returns a promise of element next after element matching given criteria.
     * @param matchFn function to match element whose successor should be returned.
     * @param promise a promise which, when fulfilled, should be followed by returning the element.
     * @returns a promise of element matching criteria.
     */
    getNextAfter: function (matchFn, promise) {
        var self = this;
        return promise.then(function() {
            return self._getNext(self._indexOf(matchFn));
        });
    },

    getElementOrNull: function(index) {
        var self = this;
        var elements = self.elements;
        if (_.isEmpty(elements)) {
            return null;
        }
        if (elements.length <= index) {
            return elements[elements.length - 1];
        }
        return elements[index];
    },

    _getNext: function (index) {
        var self = this;
        var elements = self.elements;
        if (_.isEmpty(elements)) {
            return null;
        }
        if (index === elements.length - 1) {
            return elements[elements.length - 1];
        }
        return elements[index + 1];
    }
};