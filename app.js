// Data CONTROLLER
var budgetController = (function () {

    /** Expense Constructor function */
    var Expense = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calculatePercentage = function () {
        var totalIncome = data.totals.inc;
        if (totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        }
        else {
            this.percentage = -1;
        }
    };

    Expense.prototype.getPercentage = function () {
        return this.percentage;
    };

    /** Income Constructor function */
    var Income = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    var data = {
        Items: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1,

    };

    var calculateTotals = function (type) {
        var sum = 0;
        data.Items[type].forEach(function (e) {
            sum += e.value;
        });
        data.totals[type] = sum;
    };

    return {
        addItem: function (type, desc, val) {
            var item, id;

            if (data.Items[type].length > 0) {
                // create new id  [lastitemId + 1]
                id = data.Items[type][data.Items[type].length - 1].id + 1;
            } else {
                id = 0;
            }

            // create new item based on 'inc' or 'exp' type
            switch (type) {
                case 'exp':
                    item = new Expense(id, desc, val);
                    break;
                case 'inc':
                    item = new Income(id, desc, val);
                    break;
            }

            data.Items[type].push(item);
            return item;
        },
        removeItem: function (type, id) {
            var ids, index;
            ids = data.Items[type].map(function (e) { return e.id; });
            index = ids.indexOf(id);

            if (index !== -1) {
                data.Items[type].splice(index, 1);
            }

        },
        calculateBudget: function () {
            // total income and expenses
            calculateTotals('exp');
            calculateTotals('inc');

            // budget = income - expenses
            data.budget = data.totals.inc - data.totals.exp;

            // percentage of income we spent
            if (data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1;
            }
        },
        getBudget: function () {
            return {
                budget: data.budget,
                percentage: data.percentage,
                totalIncome: data.totals.inc,
                totalExpenses: data.totals.exp
            };
        },
        calculatePercentages: function () {
            data.Items.exp.forEach(function (e) {
                e.calculatePercentage();
            });
        },
        getPercentages: function () {
            var percentages = data.Items.exp.map(function (e) {
                return e.getPercentage();
            });
            return percentages;
        },
        checkData: function () { return data; }

    };

})();

// UI CONTROLLER
var UIController = (function () {

    // Idea: Create a builder Contructor function e.g. AddString('class','add__type') ==> '.add__type'
    var DOMSelectors = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeList: '.income__list',
        expensesList: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        expensesPercentage: '.budget__expenses--percentage',
        container: '.container',
        expensesPecentageLabel: '.item__percentage',
        dateLabel: '.budget__title--month'
    };

    var formatNumber = function (num, fraction) {
        fraction = fraction || 3; // default value for splitting
        var r = Math.floor(num.length / fraction);
        var q = Math.floor(num.length % fraction);
        var splitted = [];
        for (var i = 0; i < r + 1; i++) {
            if (i === 0) {
                splitted.push(num.substr(i, q));
            }
            else {
                splitted.push(num.substr(q, fraction));
                q += fraction;
            }
        }
        // ["", '100','000','000'] trim the first item in the string
        if (splitted[0] === "") {
            splitted.shift();
        }
        return splitted.join(',');
    };

    var format = function (num, type) {
        var numParts, int, dec;
        num = Math.abs(num);
        num = num.toFixed(2); // two fractional points format
        numParts = num.split('.');
        int = numParts[0];
        dec = numParts[1];

        // fomart numbers
        int = formatNumber(int);

        // set sign
        if (type === 'exp') {
            int = '- ' + int;
        } else if (type === 'inc') {
            int = '+ ' + int;
        }

        return int + '.' + dec;
    };

    return {
        /** Get the dom strings used in the UI */
        getDomSelectors: function () {
            return DOMSelectors;
        },
        /** Get input from the UI */
        getInput: function () {
            return {
                type: document.querySelector(DOMSelectors.inputType).value,
                description: document.querySelector(DOMSelectors.inputDescription).value,
                value: parseFloat(document.querySelector(DOMSelectors.inputValue).value),
            };
        },
        addListItem: function (obj, type) {
            var template, html, list;

            // Create Html String with placeholder text
            if (type === 'inc') {
                list = DOMSelectors.incomeList;
                template = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (type === 'exp') {
                list = DOMSelectors.expensesList;
                template = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }

            // replace placeholder text with actual data
            html = template.replace('%id%', obj.id).replace('%description%', obj.description).replace('%value%', format(obj.value, type));

            // insert html into the dom
            document.querySelector(list).insertAdjacentHTML('beforeend', html);
        },
        clearFields: function () {
            var fields = document.querySelectorAll(DOMSelectors.inputDescription + ',' + DOMSelectors.inputValue);
            fields.forEach(e => {
                e.value = "";
            });
            fields[0].focus();
        },
        displayBudget: function (obj) {
            var type = obj.budget > 0 ? 'inc' : 'exp';
            document.querySelector(DOMSelectors.budgetLabel).textContent = format(obj.budget, type);
            document.querySelector(DOMSelectors.incomeLabel).textContent = format(obj.totalIncome, 'inc');
            document.querySelector(DOMSelectors.expensesLabel).textContent = format(obj.totalExpenses, 'exp');
            if (obj.percentage < 1) {
                document.querySelector(DOMSelectors.expensesPercentage).textContent = '---';
            }
            else {
                document.querySelector(DOMSelectors.expensesPercentage).textContent = obj.percentage + '%';
            }
        },
        removeListItem: function (selector) {
            var el = document.querySelector('#' + selector);
            el.parentNode.removeChild(el);
        },
        displayPercentages: function (percentages) {
            var fields = document.querySelectorAll(DOMSelectors.expensesPecentageLabel); // returns a node list
            fields.forEach(function (e, i) {
                e.textContent = percentages[i] + '%';
            });

        },
        displayDate: function () {
            var now, year, month;
            now = new Date();
            year = now.getFullYear();
            month = now.getMonth();

            var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            document.querySelector(DOMSelectors.dateLabel).textContent = months[month] + ', ' + year;
        },
        changedType: function () {
            var elements = document.querySelectorAll(DOMSelectors.inputType + ',' + DOMSelectors.inputValue + ',' + DOMSelectors.inputDescription);
            elements.forEach(function (el) {
                el.classList.toggle('red-focus');
            });
            document.querySelector(DOMSelectors.inputBtn).classList.toggle('red');

        }

    };
})();

// GLOBAL APP CONTROLLER
var controller = (function (budgetCtrl, UICtrl) {

    var setupEventListeners = function () {
        // DOM Selectors
        var DOM = UICtrl.getDomSelectors();

        // Add Item
        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);
        document.addEventListener('keypress', function (e) {
            if (e.keyCode === 13 || e.which === 13 /*for old browsers support*/) {
                ctrlAddItem();
                // known issue: enter while button is selected will execute the function twice.
            }
        });
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
        // Event Delegation
        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);
    };

    // Event Handlers 

    var ctrlAddItem = function () {
        var input, item;
        input = UICtrl.getInput();
        if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
            item = budgetCtrl.addItem(input.type, input.description, input.value);
            UICtrl.addListItem(item, input.type);
            UICtrl.clearFields();
            updateBudget();
            updatepercentages();
        }
    };
    var updatepercentages = function () {
        budgetCtrl.calculatePercentages();
        var percentages = budgetCtrl.getPercentages();
        UICtrl.displayPercentages(percentages);
    };
    var updateBudget = function () {
        budgetCtrl.calculateBudget();
        var budget = budgetCtrl.getBudget();
        UICtrl.displayBudget(budget);
    };

    var ctrlDeleteItem = function (e) {
        var itemId;
        itemId = e.target.parentNode.parentNode.parentNode.parentNode.id;
        if (itemId) {
            var type = itemId.split('-')[0];
            var id = parseInt(itemId.split('-')[1]);
            // Delete item from DataStructure
            budgetCtrl.removeItem(type, id);
            // Delete item from UI
            UICtrl.removeListItem(itemId);
            // Re-Calculate the Budget
            updateBudget();
            updatepercentages();
        }
    };

    return {
        init: function () {
            console.log('Application Has Started');
            setupEventListeners();
            UICtrl.displayBudget({
                budget: 0,
                percentage: 0,
                totalIncome: 0,
                totalExpenses: 0
            });
            UICtrl.displayDate();

        }
    };
})(budgetController, UIController);

controller.init();