/**
 * Scripts for the mobile filter dialog.
 */
//Reference to the parent window since this is loading in an iframe
var win = window.parent;
var $ = win.jQuery;

// Variable to keep track of the query string.  
// It starts out with the current query string of the parent window.
var filterSearch = win.location.search;

/**
 * Shows the filter options for a specific field.
 * @param HTMLElement targetEl The element that triggered the event.
 */
function showOptions(targetEl) {
    var $ = win.jQuery;
    var options = $('>.xf-filter-options', $(targetEl).parent());
    
    $(options).addClass('slidein');
    win.activeSheet.pushState({
        back : function() {
            $(options).removeClass('slidein');
        },
        el : options.get(0)
    });
    
}

/**
 * Apply the current filters to the parent page. 
 * This will reload the whole page so we will be leaving our filter session.
 */
function applyFilters() {
    if (win.activeSheet) {
        win.activeSheet.close();
    }
    win.jQuery('<div class="spin fillscreen"></div>').appendTo(win.document.body);
    win.location.search=filterSearch;
    return false;
}

function updateFieldValue(field, value) {
    var re = new RegExp('&'+field+'=[^&]*');
    filterSearch = filterSearch.replace(re, '');
    if (value) {
        filterSearch += '&' + encodeURIComponent(field) + '=' + encodeURIComponent(value);
    }
}

/**
 * Updates the filter string with the current settings chosen by the user.
 * @param HTMLElement srcEl The element that triggered the change.
 * @param boolean update Whether to update the counts.  Default true.
 */
function updateFilters(srcEl, update) {
    if (update === undefined) {
        update = true;
    }
    var $ = win.jQuery;
    var wrapper = $(srcEl).parents('[data-field]').first();
    var filterType = $(wrapper).attr('data-filter-type');
    var field = $(wrapper).attr('data-field');
    var topListItem = $(wrapper).parent();
    var filterValueSpan = $('span.xf-filter-value', topListItem);
    function updateFilterFilter() {
        
        var selectedKeys = [];
        var selectedString = '';
        $('input[data-key]', wrapper).each(function() {
            if (!this.checked) {
                return;
            }
            selectedKeys.push(this.getAttribute('data-key'));
        });
        if (selectedKeys.length == 0) {
            if (filterSearch.indexOf('&'+field+'=') >= 0) {
                var re = new RegExp('&'+field+'=[^&]*');
            
                filterSearch = filterSearch.replace(re, '');
                if (selectedKeys.length > 0) {
                    filterValueSpan.text('('+selectedKeys.length+')');
                } else {
                    filterValueSpan.text('');
                }
            
                if (update) updateCounts();
                return;
            }
        }
        var selectedString = '=' + selectedKeys.join(' OR =');
        if (filterSearch.indexOf('&'+field+'=') >= 0) {
            var re = new RegExp('&'+field+'=[^&]*');
        
            filterSearch = filterSearch.replace(re, '');
        }
        filterSearch += '&'+field+'='+encodeURIComponent(selectedString);
        if (selectedKeys.length > 0) {
            filterValueSpan.text('('+selectedKeys.length+')');
        } else {
            filterValueSpan.text('');
        }
        if (update) updateCounts();
    }
    
    function updateTextFilter() {
        var textInput = $('input.search-field', wrapper);
        var checkedOption = $('input.text-filter-option:checked', wrapper);
        var fieldVal = textInput.val();
        switch(checkedOption.val()) {
            case 'exact' :
                fieldVal = '=' + fieldVal;
                break;
            case 'startswith' :
                fieldVal = '~' + fieldVal + '%';
                break;
        
            case 'endswith' :
                fieldVal = '~%' + fieldVal;
                break;
        }
        updateFieldValue(field, fieldVal);
        if (fieldVal.length > 0) {
            filterValueSpan.text(': '+textInput.val());
        } else {
            filterValueSpan.text('');
        }
        if (update) updateCounts();
        
    }
    
    if (filterType == 'filter') {
        updateFilterFilter();
    } else if (filterType == 'text') {
        updateTextFilter();
    }
    
    
}

/**
 * Updates the counts.  This will trigger an ajax request to get the number of 
 * results there would be for the current filter selections.
 */
function updateCounts() {
    var search = filterSearch;
    var $ = win.jQuery;
    if (!$ || !$.get) return;
    
    if (search.indexOf('-action=') >= 0) {
        search = search.replace(/-action=[^&]*/, '-action=ajax_count_results');
    } else {
        search += '&-action=ajax_count_results';
    }
    $.get(search, function(res) {
        if (res && res.found) {
            document.querySelector('button.xf-apply-btn > .num-results').innerHTML = ''+res.found;

        }
    })
}

/**
 * Resets the filters - so there are no filters.
 */
function resetFilters() {
    var filterBoxes = document.querySelectorAll('input.filter-box');
    
    filterBoxes.forEach(function(input) {
        if (input.checked) {
            input.checked = false;
            updateFilters(input, false);
        }
    });
    var textFilterOptions = document.querySelectorAll('input.text-filter-option');
    textFilterOptions.forEach(function(input) {
        if (input.getAttribute('value') == 'contains') {
            input.checked = true;
        } else {
            input.checked = false;
        }
    });
    var textInputs = document.querySelectorAll('input.search-field');
    textInputs.forEach(function(input) {
        $(input).val('');
        updateFilters(input, false);
    });
    
    
    updateCounts();
}

var searchFields = document.querySelectorAll('input.search-field');
var timeoutHandle = null;
searchFields.forEach(function(input) {
    input.addEventListener('input', function(e) {
        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
        }
        timeoutHandle = setTimeout(function() {
            updateFilters(input);
        }, 500);
    });
});

var textFilterOptions = document.querySelectorAll('input.text-filter-option');
textFilterOptions.forEach(function(input) {
    input.addEventListener('click', function(e) {
        updateFilters(input);
    });
});

updateCounts();