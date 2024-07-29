frappe.pages['master-sheet'].on_page_load = function (wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Master Sheet',
        single_column: true
    });

    // Set the page direction to RTL
    document.documentElement.setAttribute('dir', 'rtl');

    // Create a container for filters and table
    const filter_area = $('<div class="filter-area row"></div>').appendTo(page.main);
    const table_container = $('<div class="table-container"></div>').appendTo(page.main);

    // Add filters
    let filters = [
        { fieldname: 'department', label: __('Department'), fieldtype: 'Link', options: 'Department' },
        { fieldname: 'stage', label: __('Stage'), fieldtype: 'Select', options: 'First Year\nSecond Year\nThird Year\nFourth Year\nFifth Year' },
        { fieldname: 'study_system', label: __('Study Type'), fieldtype: 'Select', options: 'Morning\nEvening' },
        { fieldname: 'year', label: __('Year'), fieldtype: 'Link', options: 'Educational Year' }
    ];

    // Create filter fields
    filters.forEach(filter => {
        const field = page.add_field({
            label: filter.label,
            fieldtype: filter.fieldtype,
            options: filter.options,
            fieldname: filter.fieldname,
            change: () => load_data()
        });
        $(field.wrapper).css('display', 'inline-block').css('margin', '0 10px');
        $(field.wrapper).appendTo(filter_area);
    });

    // Function to create the table
    function createTable(data) {
        table_container.empty(); // Clear previous table

        const table = $('<table class="table table-bordered table-responsive"></table>');
        const thead = $('<thead></thead>');
        const headerRow = $('<tr></tr>');

        // Create header row with dynamic columns
        headerRow.append('<th>Student</th>');
        data.columns.forEach(col => {
            if (col.fieldname !== 'student') {
                if (col.fieldname.endsWith('_a') || col.fieldname.endsWith('_b') || col.fieldname.endsWith('_c') || col.fieldname.endsWith('_d')) {
                    // Skip sub-columns here
                    return;
                }
                headerRow.append(`<th colspan="4">${col.label}</th>`);
            }
        });
        headerRow.append('<th>Status</th><th>Grade</th><th>Evaluation</th><th>Notes</th>');
        thead.append(headerRow);

        // Create sub-header row for module columns
        const subHeaderRow = $('<tr></tr>');
        subHeaderRow.append('<th></th>');
        data.columns.forEach(col => {
            if (col.fieldname !== 'student') {
                if (col.fieldname.endsWith('_a') || col.fieldname.endsWith('_b') || col.fieldname.endsWith('_c') || col.fieldname.endsWith('_d')) {
                    subHeaderRow.append(`<th>${col.label}</th>`);
                } else {
                    // Skip main columns here
                    return;
                }
            }
        });
        subHeaderRow.append('<th></th><th></th><th></th><th></th>');
        thead.append(subHeaderRow);

        table.append(thead);

        // Create table body with dynamic data
        const tbody = $('<tbody></tbody>');
        data.data.forEach(item => {
            const row = $('<tr></tr>');
            row.append(`<td>${item.student}</td>`);

            data.columns.forEach(col => {
                if (col.fieldname !== 'student') {
                    if (item[col.fieldname] !== undefined) {
                        row.append(`<td>${item[col.fieldname]}</td>`);
                    } else {
                        row.append('<td></td>');
                    }
                }
            });

            tbody.append(row);
        });

        table.append(tbody);
        table_container.append(table);
    }

    // Function to load data
    function load_data() {
        const filters = {
            department: page.fields_dict.department.get_value(),
            stage: page.fields_dict.stage.get_value(),
            study_system: page.fields_dict.study_system.get_value(),
            year: page.fields_dict.year.get_value()
        };

        frappe.call({
            method: 'kalima.kalima.page.master_sheet.master_sheet.get_master_sheet_data',
            args: { filters: JSON.stringify(filters) },
            callback: function (response) {
                createTable(response.message);
            }
        });
    }

    // Initial load
    load_data();
};
