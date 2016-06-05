// waiting for page to load
$(document).ready(function() {

	// Configuring the form ready for submission
	var reg_form = $('#register');
	// Listening for submission
	reg_form.on('submit', function() {
		// Getting the form data
		var reg_data = form_parse(reg_form),
			reg_btn = $("#reg_btn");

		// Disabling the button
		reg_btn.attr('disabled', true);
		reg_btn.text("Registering...");

		$.post("/register", reg_data, function(data) {
			// Parsing the response
			switch (data['stat']) {
				case 0:
					show_noti(0, data['message']);
					// Resetting the Button
					reg_btn.attr('disabled', false);
					reg_btn.text("Register");
					break;
				case 1:
					reg_form.trigger("reset");
					show_noti(1, data['message']);
					reg_btn.attr('disabled', false);
					reg_btn.text("Register");
					break;
			}
		}).fail( function() {
			alert("Someting went wrong!");
		});

		// Stopping the form from submittin
		return false;
	});

});

// Function for parsing the form data
function form_parse(form) {
	// Serializing the data
	var book_form_data = form.serializeArray(),
		data_obj = {};
	// Pushing the data to an array
	for (var i = 0, l = book_form_data.length; i < l; i++) {
	    data_obj[book_form_data[i].name] = book_form_data[i].value;
	}
	// Returning the object
	return data_obj;
}

// Function for showing any error messages
function show_noti(stat, msg) {
	// Declaring the ID of the notification box
	var noti_box = $("#show_noti");
	// Checking the status
	switch (stat) {
		case 0:
			noti_box.removeClass("alert alert-success");
			noti_box.addClass("alert alert-danger");
			break;
		case 1:
			noti_box.removeClass("alert alert-danger");
			noti_box.addClass("alert alert-success");
			break;
		default:
			noti_box.hide();
	}
	// Setting the text
	noti_box.html(msg);
}

function get_estab_list (to_append) {

	var sel_box = $(to_append),
		html = "<option value=''></option>";

	$.get('api/estabs', function(data) {

		// Looping through the data
		$(data).each(function(index) {
			html += "<option value='" + data[index]['estab_id'] + "'>" + data[index]['estab_name'] + "</option>";
		});

		sel_box.html(html);

	});
}

function get_tasks(to_append) {

	var sel_box = $(to_append),
		html = "";

	$.get('/tasks', function(data) {

		if (data.status === 0) { //  No data

			html += "<tr><td>";
			html += "<center>" + data.warning + "<center>";
			html += "</td></tr/>";

			sel_box.html(html);

		} else if (data.status === 1) { // There's data

			// Looping through the data
			$(data.tasks).each(function(index) {

				var due_timestamp = data.tasks[index]['due_date'],
					time_added = moment(due_timestamp).add(12, 'h'),
					date_due = time_added.format('ll'),
					time_now = moment(),
					days_left = time_added.fromNow();

				html += "<tr><td>";
				html += "<b>" + data.tasks[index]['task_name'] + " - (" + data.tasks[index]['class_name'] + ")</b>";
				html += "<p>" + data.tasks[index]['task_desc'] + "</p>";
				html += "<small>Due by: " + date_due + " (" + days_left + ")</small></td></tr/>";
			});
		}

		sel_box.html(html);

	});

}
