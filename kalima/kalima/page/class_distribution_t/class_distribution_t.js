frappe.pages['class-distribution-t'].on_page_load = function (wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: frappe._('Class Distribution Tool'),
        single_column: true
    });

    // Create a form container
    let form = new frappe.ui.FieldGroup({
        fields: [
            {
                fieldtype: 'Data',
                fieldname: 'group_title',
                label: frappe._('Title'),
                read_only: 0
            },
            {
                fieldtype: 'Link',
                fieldname: 'year',
                label: frappe._('Year'),
                options: 'Educational Year'
            },
            {
                fieldtype: 'Select',
                fieldname: 'stage',
                label: frappe._('Stage'),
                options: 'First Year\nSecond Year\nThird Year\nFourth Year\nFifth Year',
            },
            {
                fieldtype: 'Link',
                fieldname: 'faculty',
                label: frappe._('Faculty'),
                options: 'Faculty',
                onchange: function () {
                    let faculty = form.get_value('faculty');
                    if (faculty) {
                        frappe.call({
                            method: 'frappe.client.get_list',
                            args: {
                                doctype: 'Department',
                                fields: ['name'],
                                filters: {
                                    'custom_faculty': faculty
                                }
                            },
                            callback: function (r) {
                                if (r.message) {
                                    let department_field = form.get_field('department');
  
                                    department_field.df.options = r.message.map(d => d.name).join('\n');
                                    department_field.refresh();
                                }
                            }
                        });
                    }
                }
            },            
            {
                fieldtype: 'Select',
                fieldname: 'academic_system_type',
                label: frappe._('Academic system type'),
                options: "Coursat\nBologna\nAnnual"
            },
            {
                fieldtype: 'Column Break',
                fieldname: 'clmn',
            },
            // {
            //     fieldtype: 'Link',
            //     fieldname: 'department',
            //     label: 'Department',
            //     options: 'Department',
            //     onchange: function () {
            //     }
            // },
            {
                fieldtype: 'Select',
                fieldname: 'department',
                label: frappe._('Department'),
                options: '',
                onchange: function () {
                }
            },
            {
                fieldtype: 'Select',
                fieldname: 'study_system',
                label: frappe._('Study System'),
                options: 'Morning\nEvening',
            },
            {
                fieldtype: 'Select',
                fieldname: 'semester',
                label: frappe._('Semester'),
                options: 'Fall Semester\nSpring Semester\nShort Semester\nAnnual',
            },
            {
                fieldtype: 'Select',
                fieldname: 'divisions',
                label: frappe._('Divisions'),
                options: "1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15\n16\n17\n18\n19\n20"
            },
            {
                fieldtype: 'Section Break',
                fieldname: 'clmn',
            },
            {
                fieldtype: 'Button',
                fieldname: 'get_modules',
                label: frappe._('Get Modules'),
                click: function () {
                    let stage = form.get_value('stage');
                    let department = form.get_value('department');
                    let faculty = form.get_value('faculty');
                    let semester = form.get_value('semester');
                    let academic_system_type = form.get_value('academic_system_type');
                    let year = form.get_value('year');
                    get_modules(faculty, stage, department,semester,academic_system_type,year);
                }
            },            
            {
                fieldtype: 'Column Break',
                fieldname: 'clmn',
            },
            {
                fieldtype: 'Button',
                fieldname: 'fetch_students',
                label: frappe._('Fetch Students'),
                click: function () {
                    let stage = form.get_value('stage');
                    let department = form.get_value('department');
                    let semester = form.get_value('semester');
                    let study_system = form.get_value('study_system');
                    let year = form.get_value('year');
                    fetch_students(stage, department, semester, study_system, year);
                }
            },
            {
                fieldtype: 'Column Break',
                fieldname: 'clmn',
            },
            {
                fieldtype: 'Button',
                fieldname: 'create_classes',
                label: frappe._('Create Classes'),
                click: function () {
                    let group_title = form.get_value('group_title');
                    let department = form.get_value('department');
                    let stage = form.get_value('stage');
                    let semester = form.get_value('semester');
                    let year = form.get_value('year');
                    let divisions = form.get_value('divisions');
                    let academic_system_type = form.get_value('academic_system_type');
                    generate_classes(group_title, year, stage, semester, department, divisions, academic_system_type);
                }
            },
            {
                fieldtype: 'Column Break',
                fieldname: 'clmn',
            },
            {
                fieldtype: 'Section Break',
                fieldname: 'clmn',
            },
        ],
        body: page.body
    });

    form.make();

    // Add module list container and buttons
    let moduleListContainer = $('<div id="module-list"></div>').appendTo(page.body);

    let buttonContainer = $('<div class="button-container"></div>').appendTo(page.body);
    $('<button class="btn btn-secondary">' + frappe._('Select All Modules') + '</button>').appendTo(buttonContainer).click(selectAllModules);
    $('<p></p>').appendTo(buttonContainer).click(selectAllModules);
    $('<button class="btn btn-secondary">' + frappe._('Deselect All Modules') + '</button>').appendTo(buttonContainer).click(deselectAllModules);

    let studentListContainer = $('<div id="student-list"></div>').appendTo(page.body);

    // Function to fetch and display students
    function fetch_students(stage, department, semester, study_system, year) {
        const selected_modules = [];

        // Get selected modules from moduleListContainer
        moduleListContainer.find('input[type="checkbox"]:checked').each(function () {
            selected_modules.push($(this).val());
        });

        if (selected_modules.length === 0 || !department) {
            frappe.msgprint(frappe._('Please select at least one module and ensure department is selected.'));
            return;
        }

        frappe.call({
            method: "kalima.utils.group_class.fetch_students",
            args: {
                selected_modules: JSON.stringify(selected_modules),
                stage: stage,
                department: department,
                semester: semester,
                study_system: study_system,
                year: year,
            },
            callback: function (r) {
                if (r.message) {
                    // Determine the number of tables and rows per table
                    let studentsPerTable = Math.ceil(r.message.length / 3);

                    // Initialize the HTML string
                    let html = '<div class="row">';

                    // Loop through to create 3 tables
                    for (let tableIndex = 0; tableIndex < 3; tableIndex++) {
                        html += '<div class="col-md-4"><table class="table table-bordered">';
                        html += `
                        <thead>
                            <tr>
                                <th>${frappe._('Checkbox')}</th>
                                <th>${frappe._('Full Name in Arabic')}</th>
                            </tr>
                        </thead>
                        <tbody>`;

                        // Add rows for the current table
                        for (let i = tableIndex * studentsPerTable; i < (tableIndex + 1) * studentsPerTable && i < r.message.length; i++) {
                            let student = r.message[i];
                            html += `
                            <tr id="row_${i}" class="clickable-cell" data-index="${i}">
                                <td>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="students" value="${student.name}" id="student_${i}">
                                        <label class="form-check-label" for="student_${i}"></label>
                                    </div>
                                </td>
                                <td class="clickable-cell-content">
                                    ${student.full_name_in_arabic}
                                </td>
                            </tr>`;
                        }

                        html += '</tbody></table></div>';
                    }

                    html += '</div>';
                    // Inject the HTML into the wrapper
                    $('#student-list').html(html);

                    // Add event listeners to handle cell click, checkbox toggle, and background color change
                    r.message.forEach(function (student, index) {
                        let row = document.getElementById(`row_${index}`);
                        let checkbox = document.getElementById(`student_${index}`);

                        row.addEventListener('click', function (event) {
                            // Only toggle the checkbox and color if the click is not on the checkbox itself
                            if (event.target.type !== 'checkbox') {
                                checkbox.checked = !checkbox.checked;
                            }
                            updateRowStyle(row, checkbox);
                        });

                        checkbox.addEventListener('change', function () {
                            updateRowStyle(row, checkbox);
                        });
                    });

                    function updateRowStyle(row, checkbox) {
                        if (checkbox.checked) {
                            row.style.backgroundColor = 'lightgreen';
                            row.style.color = 'white';
                        } else {
                            row.style.backgroundColor = '';
                            row.style.color = '';
                        }
                    }
                }
            }
        });
    }

    async function get_modules(faculty, stage, department,semester,academic_system_type,year) {
        if (faculty && department) {
            // Fetch presented modules based on the selected department and faculty
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "Presented Module",
                    filters: {
                        "faculty": faculty,
                        "stage": stage,
                        "semester": semester,
                        "academic_system_type": academic_system_type,
                        "year": year,
                    },
                    fields: ["module"]
                },
                callback: function (r) {
                    if (r.message) {
                        // Create an HTML form with checkboxes from the fetched modules
                        let html = '<div class="form-check">';
                
                        r.message.forEach(function (module, index) {
                            html += `
                                <div class="form-check">
                                    <input class="form-check-input my-1" type="checkbox" name="modules" value="${module.module}" id="module_${index}" checked>
                                    <label class="form-check-label my-1" for="module_${index}">
                                        ${module.module}
                                    </label>
                                </div><br>`;
                        });
                
                        html += '</div>';
                        moduleListContainer.html(html);
                    }
                }
                
            });
        } else {
            moduleListContainer.html("");
        }
    }

    function selectAllModules() {
        moduleListContainer.find('input[type="checkbox"]').prop('checked', true);
    }

    function deselectAllModules() {
        moduleListContainer.find('input[type="checkbox"]').prop('checked', false);
    }

    function generate_classes(group_title, year, stage, semester, department, divisions, academic_system_type) {
        const selected_modules = [];
        const selected_students = [];

        // Get selected modules from moduleListContainer
        $('#module-list').find('input[type="checkbox"]:checked').each(function () {
            selected_modules.push($(this).val());
        });

        // Get selected students from studentListContainer
        $('#student-list').find('input[type="checkbox"]:checked').each(function () {
            selected_students.push($(this).val());
        });

        if (selected_modules.length === 0 || selected_students.length === 0 || !department) {
            frappe.msgprint(frappe._('Please select at least one module and one student, and ensure department is selected.'));
            return;
        }

        frappe.call({
            method: "kalima.utils.group_class.create_classes",
            args: {
                group_title: group_title,
                year: year,
                stage: stage,
                semester: semester,
                department: department,
                group_class_modules: selected_modules,
                students: selected_students,
                divisions: divisions,
                academic_system_type: academic_system_type,
            },
            callback: function (r) {
                if (r.message) {
                    frappe.msgprint(frappe._('Classes have been successfully generated.'));

                    form.set_value('group_title', "");
                    form.set_value('department', "");
                    form.set_value('stage', "");
                    form.set_value('semester', "");
                    form.set_value('year', "");

                    // Clear form fields
                    $('input[type="text"], input[type="checkbox"], select').val('');
                    $('input[type="checkbox"]').prop('checked', true);

                    // Clear the student and module lists
                    $('#student-list').html('');
                    $('#module-list').html('');
                }
            }
        });
    }
};
