define([
    'jquery', 
    'uiComponent', 
    'ko'
], function ($, Component) {
    'use strict';
    return Component.extend({
        attributes: [],
        urlParams: {},
        originalUrlParams: {},
        totalCount: 0,
        filterContent: '',
        defaults: {
            template: 'Trespass_Filter/filter-component',
        },
        initialize: function () {
            this._super();
            this.loadFilterAttributes();
        },
        init: function() {
            this.initFilterBar();
            this.initFilterState();
            this.jQueryActivities();
        },
        jQueryActivities: function() {
            var self = this;
            $(document).on("click", function(event){
                if($(window).width() > 768) {
                    var $trigger = $(".component-wrapper .filter");
                    if($trigger !== event.target && !$trigger.has(event.target).length){
                        $('.component-wrapper .filter').removeClass('active');
                        $('.component-wrapper .filter .dropdown').removeClass('open');
                    }            
                }
            });
            $('.component-wrapper .filter').on('click', 'a.top-level', function(e) {
                e.preventDefault();
                
                if($(this).parent().hasClass('active')) {
                    $('.component-wrapper .filter').removeClass('active');
                } else {
                    $('.component-wrapper .filter').removeClass('active');
                    $(this).parent().addClass('active');
                }
            });
            
            // case 1: when customers click a checkbox to add the filter attribute
            $('.filterbar .dropdown').on('click', 'input[type="checkbox"]', function() {
                var datasource = $(this).attr('datasource');
                var attrName = datasource.split('-')[0];
                var value = datasource.split('-')[1]; 
                var label = datasource.split('-')[2]               

                if($(this).is(':checked')) {
                    var title = self.toCapitalize(attrName) + ': ' + label;
                    self.insertState(datasource, title);
                    self.insertToUrlParams(attrName, value);
                } else {
                    $('.filter-states .filter-items .state-item[datasource="' + datasource + '"]').remove();
                    self.removeFromUrlParams(attrName, value);
                }
            });

            // case 2: when customers change the price range
            $('.filterbar .price-wrapper').on('click', 'a.action', function() {
                var minPrice = parseInt($('.filterbar .price-wrapper input.min-price').val());
                var maxPrice = parseInt($('.filterbar .price-wrapper input.max-price').val());
                var title = '';

                if(minPrice > maxPrice) {
                    var temp = minPrice;
                    minPrice = maxPrice; maxPrice = temp;
                }
                $('.filterbar .price-wrapper input.min-price').val(minPrice);
                $('.filterbar .price-wrapper input.max-price').val(maxPrice);                    

                title = 'Price: ' + self.getFormattedPrice(minPrice) + '-' + self.getFormattedPrice(maxPrice);

                if($('.filter-states .filter-items .state-item[datasource="price"]').length > 0) {
                    $('.filter-states .filter-items .state-item[datasource="price"]').text(title);                    
                } else {
                    self.insertState('price', title);
                }
                self.insertToUrlParams('price', minPrice + '-' + maxPrice);                
            }); 

            // case 3: when customers click an item in the filter state bar
            $('.filter-states .filter-items').on('click', ' a.state-item', function(e) {
                e.preventDefault();
                var datasource = $(this).attr('datasource');
                var attrName = datasource.split('-')[0];
                var value = datasource.split('-')[1];
                
                this.remove();
                $('.component-wrapper .filter .dropdown input[datasource*="' + datasource + '"]').removeAttr('checked');
                self.removeFromUrlParams(attrName, value);
            });

            // case 4: when customers click the button "Apply Filters"
            $('.filter-states .action.filter-apply').on('click', function(e) {
                e.preventDefault();
                location.href = self.getUrl();
            });

            // Click filter button on mobile
            $('.filter-button').on('click', function(e) {
                e.preventDefault();
                $('.trespass-layered-nav').removeClass('closed');
            });

            // Close mobile filter popup
            $('.filter-states .action.close').on('click', function(e) {
                e.preventDefault();
                $('.trespass-layered-nav').addClass('closed');
            });

            $(window).resize(function() {
                self.moveFilterBar();
            });

            return true;
        },
        getUrl: function() {
            var url = this.currentUrl;
            $.each(this.urlParams, function(key, param) {
                if(key == 'color') key = 'colour';
                url += '/' + key + '/';
                if(typeof(param) == 'string') {                    
                    url += param; 
                } else {
                    url += param.toString().replaceAll(',', ';');
                }
            });

            return url;
        },
        sortUrlParams: function() {
            var self = this;
            $.each(this.urlParams, function(key, item) {
                if(typeof(item) != 'string') {
                    self.urlParams[key] = item.sort();
                }
            });
        },
        insertToUrlParams(key, value) {
            if(!this.urlParams.hasOwnProperty(key)) {
                this.urlParams[key] = value;
            } else {
                if(key == 'price') 
                    this.urlParams[key] = value;
                else {
                    var newArray = [];

                    if(typeof(this.urlParams[key]) == 'string') {
                        newArray.push(this.urlParams[key]);
                        newArray.push(value);
                    } else {
                        newArray = this.urlParams[key];
                        newArray.push(value);
                    }
                    this.urlParams[key] = newArray;
                }
            }
            this.sortUrlParams();

            // shows or not "Apply Filter" button
            this.isStateUpdated();
        },
        removeFromUrlParams: function(key, value) {
            if(this.urlParams.hasOwnProperty(key)) {
                if(typeof(this.urlParams[key]) == 'string')
                    delete this.urlParams[key];
                else {
                    var newArray = this.urlParams[key];
                    const index = newArray.indexOf(value);
                    if(index > -1) newArray.splice(index, 1);

                    if(newArray.length > 1) {
                        this.urlParams[key] = newArray;
                    } else {
                        this.urlParams[key] = newArray[0];
                    }
                }
                this.sortUrlParams();
            }

            // shows or not "Apply Filter" button
            this.isStateUpdated();
        },

        // Get formatted price
        getFormattedPrice(price) {
            return this.currencySymbol + String(price);
        },

        // Insert the selected attribute into the filter state bar
        insertState:function(datasource, title) {
            var html = '<a class="state-item" datasource="' + datasource + '" href="#">' + title + '</a>';
            $('.filter-states .filter-items').append(html);
        },

        // Shows the filter state bar or not
        displayFilterState: function() {
            if($('.filter-states .filter-items .state-item').length > 0) {
                $('.filter-states').removeClass('closed');
            } else {
                $('.filter-states').addClass('closed');
            }
        },

        // Initialize the filter state bar        
        initFilterState: function() {
            var self = this;

            $.each(this.urlParams, function(key, param) {
                var title = '';
                var className = key;

                if(key == 'price') {
                    var minPrice = param.split('-')[0];
                    var maxPrice = param.split('-')[1];
                    
                    title = self.toCapitalize(key) + ': ' + self.getFormattedPrice(minPrice) + '-' + self.getFormattedPrice(maxPrice);
                    self.insertState('price', title); 

                } else {
                    if(typeof(param) == 'string') {
                        className = key + '-' + param;
                        title = self.toCapitalize(key) + ': ' + param;
                        self.insertState(className, title);

                    } else if(typeof(param) == 'object') {
                        param.forEach(function(item) {
                            className = key + '-' + item;
                            title = self.toCapitalize(key) + ': ' + item;
                            self.insertState(className, title);
                        });
                    }
                }
            });
            
            this.displayFilterState();
        },
        isStateUpdated: function() {
            if($('.filter-states .filter-items .state-item').length < 1) {
                $('.filter-states').addClass('empty');
            } else {
                $('.filter-states').removeClass('empty');
            }

            if(JSON.stringify(this.urlParams) === JSON.stringify(this.originalUrlParams)) {                

                $('.filter-states .action.filter-apply').addClass('closed');

                return true;
            }
            $('.filter-states .action.filter-apply').removeClass('closed');

            return false;
        },
        
        // Initialize filter bar
        initFilterBar: function() {
            var html = '';
            var self = this;

            $.each(this.attributes, function(key, attr) {
                var isSelected = false;

                if((Object.keys(attr.options).length == 1) && self.totalCount == attr.options[0].count) return true;

                html += '<div class="filter"><a href="#" class="top-level"' + 'datasource="' + attr.attribute_code + '">' + attr.label + '</a>';
                html += '<div class="dropdown ' + attr.attribute_code + '">';
                
                if(self.params.hasOwnProperty(attr.attribute_code)) {
                    isSelected = true;
                    self.urlParams[attr.label.toLowerCase()] = self.params[attr.attribute_code];                    
                }

                if(attr.attribute_code == 'price') {
                    var minPriceObj = attr.options.reduce(function(res, obj) {
                        return (parseInt(obj.value) < parseInt(res.value)) ? obj : res;
                    });
                    var maxPriceObj = attr.options.reduce(function(res, obj) {
                        return (parseInt(obj.value) > parseInt(res.value)) ? obj : res;
                    });

                    var minPrice = minPriceObj.value;
                    var maxPrice = maxPriceObj.value;
                    
                    if(isSelected) {
                        var prices = self.params.price.split('-');
                        minPrice = prices[0];
                        maxPrice = prices[1];
                    }

                    html += '<div class="price-wrapper">';
                    html += '<input type="number" class="min-price" value="' + minPrice + '"> - <input type="number" class="max-price" value="' + maxPrice + '">'
                    html += '<a class="action update-price">Update</a>';
                    html += '</div>';
                } else if(attr.attribute_code == 'category_id') {
                    if(Object.keys(self.subCategories).length) {
                        $.each(attr.options, function(optionKey, option) {
                            if(option.count > 0) {
                                html += '<div class="option category"><div><a href="' + self.subCategories[option.label] + '">' + option.label + '</a></div><span>' + option.count + '</span></div>';    
                            }
                        });
                    }
                } else {
                    $.each(attr.options, function(optionKey, option){
                        var checkedAttr = '';                    
                        if(isSelected) {
                            if(typeof(self.params[attr.attribute_code]) == 'string') {
                                if(self.params[attr.attribute_code] == option.value) {
                                    checkedAttr = ' checked="checked"';
                                }
                            }
                            else if(self.params[attr.attribute_code].includes(option.value)) {
                                checkedAttr = ' checked="checked"';
                            }
                        }
                        var optionId = 'filter-' + $.trim(option.label.toLowerCase());
                        html += '<div class="option"><div><input type="checkbox" id="' + optionId + '" datasource="' + attr.label.toLowerCase() + '-' + option.value + '-' + option.label + '"' + checkedAttr + '><label for="' + optionId + '">' + option.label + '</label></div><span>' + option.count + '</span></div>';
                    });
                }

                html += '</div></div>';
            });

            self.filterContent = html;
            self.moveFilterBar();
            
            // Move the toolbar under filter bar
            $('.toolbar.toolbar-products').first().appendTo('.toolbar-wrapper .inline'); 
            $('#toolbar-amount').appendTo('.toolbar-wrapper');           

            $('.toolbar-wrapper').removeClass('closed');
            self.originalUrlParams = JSON.parse(JSON.stringify(self.params));
            // console.log(this.urlParams);

            return true;
        },
        moveFilterBar: function() {            
            if($('#filter-component .component-wrapper .filter').length < 1) {
                $('#filter-component .component-wrapper').html(this.filterContent);
            }
            if($(window).width() >= 768) {
                // Desktop
                if($('.column.main > .filter-states').length < 1) {
                    $('.filter-states').prependTo('.column.main');
                }
                if($('.toolbar-wrapper .filterbar').length < 1) {
                    $('#filter-component').insertBefore('.toolbar-wrapper .inline .toolbar');
                }
            } else {
                // Mobile
                if($('.page-wrapper .trespass-layered-nav').length < 1) {
                    $('.page-wrapper').prepend('<div class="trespass-layered-nav closed"><div class="block-content"></div></div>')
                }
                if($('.page-wrapper .trespass-layered-nav .filterbar').length < 1) {                    
                    $('#filter-component').appendTo('.page-wrapper .trespass-layered-nav .block-content');
                }
                if($('.page-wrapper .trespass-layered-nav > .filter-states').length < 1) {
                    $('.filter-states').prependTo('.page-wrapper .trespass-layered-nav .block-content');
                }                
            }
        },
        loadFilterAttributes: function() {
            var self = this;

            fetch('/graphql', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    query: `query($catid: String) {
                        products(filter: { category_id: { eq: $catid} }) {
                          total_count
                          aggregations{
                            attribute_code
                            label
                            count
                            options{
                              count
                              label
                              value
                            }
                          }
                        }
                     }`,
                     variables: {
                        catid: this.categoryId
                     }
                })
            }).then(function (response) {
                // The API call was successful!
                return response.json();
            }).then(function(data) {
                self.totalCount = data.data.products.total_count; 
                self.attributes = data.data.products.aggregations;
                // console.log(self.attributes);                
                self.init();
            }).catch(function(err) {
                console.warn('Something went wrong.', err);
                return {};
            })
        },
        toCapitalize: function(str) {
            return str.charAt(0).toUpperCase() + str.slice(1)
        }
    });    
});