'use strict';

define('forum/groups/list', [
	'forum/infinitescroll', 'benchpress', 'api', 'bootbox', 'alerts',
], function (infinitescroll, Benchpress, api, bootbox, alerts) {
	const Groups = {};

	Groups.init = function () {
		infinitescroll.init(Groups.loadMoreGroups);

		// Group creation
		$('button[data-action="new"]').on('click', function () {
			// Modificamos el prompt de Bootbox para incluir los nuevos campos
			const currentYear = new Date().getFullYear();
            const yearOptions = Array.from({length: 10}, (_, i) => `<option value="${currentYear + i}">${currentYear + i}</option>`).join('');
			
			bootbox.dialog({
				title: '[[groups:new-group.group-name]]',
                message: '<p>[[groups:new-group.course-code]]:</p>'+
						 '<p><input id="newGroupCode" class="bootbox-input bootbox-input-text form-control" autocomplete="off" type="text" placeholder=[[groups:new-group.course-code]]></p>' +
                         '<p>[[groups:new-group.course-name]]:</p>'+
						 '<p><input id="newGroupName" class="bootbox-input bootbox-input-text form-control" autocomplete="off" type="text" placeholder=[[groups:new-group.course-name]]></p>' +
						 '<p>[[groups:new-group.course-trim]]:</p>'+
						 '<select id="newGroupTrim" class="form-control">' +
						 	'<option value=""> —— </option>' +
							'<option value="Ene-Mar">Ene-Mar</option>' +
							'<option value="Abr-Jul">Abr-Jul</option>' +
							'<option value="Sep-Dic">Sep-Dic</option>' +
							'<option value="Verano">Verano</option>' +
						 '</select></br>' +
						 '<p>[[groups:new-group.course-year]]:</p>'+
						 '<select class="form-control" id="newGroupYear">'+
                         	`${yearOptions}` +
                         '</select>',
                buttons: {
                    cancel: {
                        label: 'Cancel',
                        className: 'btn-default',
                    },
                    ok: {
                        label: 'OK',
                        className: 'btn-primary',
                        callback: function () {
							var code = $('#newGroupCode').val();
                            var name = $('#newGroupName').val();
							var trimestre = $('#newGroupTrim').val();
							var year = $('#newGroupYear').val();
                            if (name && name.length && code && code.length && trimestre && trimestre.length) {
                                api.post('/groups', {
                                    name: code + " | " + name + " | " + trimestre + " " + year + " | " + "Prof. " + app.user.username,
                                }).then((res) => {
                                    ajaxify.go('groups/' + res.slug);
                                }).catch(alerts.error);
                            }
                        }
                    }
                }
            });
			createYearPicker($('.bootbox'));
		});
		const params = utils.params();
		$('#search-sort').val(params.sort || 'alpha');

		// Group searching
		$('#search-text').on('keyup', Groups.search);
		$('#search-button').on('click', Groups.search);
		$('#search-sort').on('change', function () {
			ajaxify.go('groups?sort=' + $('#search-sort').val());
		});
	};

	Groups.loadMoreGroups = function (direction) {
		if (direction < 0) {
			return;
		}

		infinitescroll.loadMore('/groups', {
			sort: $('#search-sort').val(),
			after: $('[component="groups/container"]').attr('data-nextstart'),
		}, function (data, done) {
			if (data && data.groups.length) {
				Benchpress.render('partials/groups/list', {
					groups: data.groups,
				}).then(function (html) {
					$('#groups-list').append(html);
					done();
				});
			} else {
				done();
			}

			if (data && data.nextStart) {
				$('[component="groups/container"]').attr('data-nextstart', data.nextStart);
			}
		});
	};

	Groups.search = function () {
		const groupsEl = $('#groups-list');
		const queryEl = $('#search-text');
		const sortEl = $('#search-sort');

		socket.emit('groups.search', {
			query: queryEl.val(),
			options: {
				sort: sortEl.val(),
				filterHidden: true,
				showMembers: true,
				hideEphemeralGroups: true,
			},
		}, function (err, groups) {
			if (err) {
				return alerts.error(err);
			}
			groups = groups.filter(function (group) {
				return group.name !== 'registered-users' && group.name !== 'guests';
			});
			Benchpress.render('partials/groups/list', {
				groups: groups,
			}).then(function (html) {
				groupsEl.empty().append(html);
			});
		});
		return false;
	};

	return Groups;
});
