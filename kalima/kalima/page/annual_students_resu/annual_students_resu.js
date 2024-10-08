frappe.pages['annual-students-resu'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __('Annual Students Result Sheet'),
		single_column: true
	});

	var crv = 0;

	// Create a form container
	let form = new frappe.ui.FieldGroup({
		fields: [
			{
				fieldtype: 'Link',
				fieldname: 'department',
				label: __('Department'),
				options: 'Department',
				read_only: 0,
				reqd: 1,
				onchange: function () {
					let department = form.get_value('department');
					if (department) {
						frappe.call({
							method: 'frappe.client.get_list',
							args: {
								doctype: 'Presented Module',
								fields: ['name', 'module_name'],
								filters: {
									'department': department
								}
							},
							callback: function (r) {
								if (r.message) {
									let module_field = form.get_field('module');
									module_field.df.options = r.message.map(d => ({
										label: d.module_name,
										value: d.name
									}));
									module_field.refresh();
								}
							}
						});
					}
				}
			},
			{
				fieldtype: 'Select',
				fieldname: 'module',
				label: __('Module'),
				reqd: 1,
				onchange: async function (v) {
					var mod = await frappe.db.get_doc("Presented Module", form.get_value('module'));
					form.set_value("stage", mod.stage);
					form.set_value("academic_system_type", mod.academic_system_type);
				},
				options: '',
				read_only: 0
			},
			{
				fieldtype: 'Select',
				fieldname: 'round',
				label: __('Round'),
				reqd: 1,
				options: __("First\nSecond\nThird")
			},
			{
				fieldtype: 'Button',
				fieldname: 'fetch_students',
				label: __('Fetch Students'),
				click: function () {
					let stage = form.get_value('stage');
					let department = form.get_value('department');
					let semester = form.get_value('semester');
					let module = form.get_value('module');
					let round = form.get_value('round');
					let academic_system_type = form.get_value('academic_system_type');
					fetch_students(stage, department, semester, module, round, academic_system_type);
				}
			},
			{
				fieldtype: 'Column Break',
				fieldname: 'clmn',
				options: 'Presented Module',
			},
			{
				fieldtype: 'Select',
				fieldname: 'stage',
				label: __('Stage'),
				options: __("First Year\nSecond Year\nThird Year\nFourth Year\nFifth Year"),
				read_only: 1
			},
			{
				fieldtype: 'Select',
				fieldname: 'academic_system_type',
				label: __('Academic system type'),
				options: __("Coursat\nBologna\nAnnual"),
				read_only: 1
			},
			{
				fieldtype: 'Section Break',
				fieldname: 'scnb',
				label: '',
			},
			{
				fieldtype: 'Float',
				fieldname: 'curve',
				label: __('Curve'),
				onchange: function (v) {
					let curve = form.get_value('curve');
					crv = curve;
					let stage = form.get_value('stage');
					let department = form.get_value('department');
					let semester = form.get_value('semester');
					let module = form.get_value('module');
					let round = form.get_value('round');
					let academic_system_type = form.get_value('academic_system_type');
					fetch_students(stage, department, semester, module, round, academic_system_type);
				}
			},
		],
		body: page.body
	});

	form.make();

	// Function to fetch students and display them in a table
	function fetch_students(stage, department, semester, module, round, academic_system_type) {
		frappe.call({
			method: 'kalima.utils.utils.get_student_sheet_annual',
			args: {
				module: module,
				round: round,
			},
			callback: function (response) {
				if (response.message) {
					let students = response.message;
					display_students(students);
				}
			}
		});
	}

	// Function to display students in a Bootstrap table
	function display_students(students) {
		// Check if a table already exists and remove it
		var $existingTable = $(wrapper).find('.student-table-container');
		if ($existingTable.length) {
			$existingTable.remove();
		}

		let table_html = `
            <div class="student-table-container">
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>${__('Student')}</th>
                            <th>${__('Formative Assessment')}</th>
                            <th>${__('Half Year Exam')}</th>
                            <th>${__('Final Exam')}</th>
                            <th>${__('Curve')}</th>
                            <th>${__('Attended the Exam')}</th>
                            <th>${__('Result')}</th>
                            <th>${__('Status')}</th>
                            <th>${__('Notes')}</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

		students.forEach(student => {
			var res = student.formative_assessment + student.midterm + student.final_exam_result + crv;
			var status = __("Failed");
			if (res > 49) {
				status = __("Passed");
			}

			table_html += `
                <tr>
                    <td>${student.name}</td>
                    <td><input readonly value="${student.formative_assessment}" type="number" class="form-control final-result" placeholder="${__('Final Result')}" min="0" max="40" required></td>
                    <td><input readonly value="${student.midterm}" type="number" class="form-control final-result" placeholder="${__('Midterm')}" min="0" max="10" required></td>
                    <td><input readonly value="${student.final_exam_result}" type="number" class="form-control final-result" placeholder="${__('Final')}" min="0" max="50" required></td>
                    <td><input readonly value="${crv}" type="number" class="form-control final-result" placeholder="" min="0" max="50" required></td>
                    <td><input readonly value="${student.present}" value="${__('Yes')}" type="text" class="form-control final-result" required></td>
                    <td><input readonly value="${res}" value="60" type="text" class="form-control final-result" required></td>
                    <td><input readonly value="${status}" value="60" type="text" class="form-control final-result"></td>
                    <td><input type="text" class="form-control final-result" placeholder="${__('Notes')}"></td>
                </tr>
            `;
		});

		table_html += `
                    </tbody>
                </table>
                <button class="btn btn-primary submit-results">${__('Submit Results')}</button>
            </div>
        `;

		var $container = $(wrapper).find('.layout-main-section');
		$container.append(table_html);

		$container.find('.submit-results').on('click', function () {
			submit_results();
		});
	}

	function submit_results() {
		// Collect form data
		let form_data = form.get_values();

		// Collect table data
		let students_data = [];
		$(wrapper).find('.student-table-container tbody tr').each(function () {
			let student_data = {
				name: $(this).find('td:eq(0)').text(),
				formative_assessment: $(this).find('td:eq(1) input').val(),
				midterm: $(this).find('td:eq(2) input').val(),
				final_exam_result: $(this).find('td:eq(3) input').val(),
				curve: $(this).find('td:eq(4) input').val(),
				present: $(this).find('td:eq(5) input').val(),
				result: $(this).find('td:eq(6) input').val(),
				status: $(this).find('td:eq(7) input').val(),
				notes: $(this).find('td:eq(8) input').val()
			};
			students_data.push(student_data);
		});

		// Send data to server
		frappe.call({
			method: 'kalima.utils.utils.submit_student_sheet_annual',
			args: {
				form_data: form_data,
				students_data: students_data
			},
			callback: function (response) {
				if (response.message) {
					frappe.msgprint(__('Results submitted successfully!'));
				}
			}
		});
	}
};
