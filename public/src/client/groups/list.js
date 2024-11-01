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
			bootbox.dialog({
				title: '[[groups:new-group.group-name]]',
                message: '<p><input id="newGroupCode" class="bootbox-input bootbox-input-text form-control" autocomplete="off" type="text" placeholder=[[groups:new-group.course-code]]></p>' +
                         '<p><input id="newGroupName" class="bootbox-input bootbox-input-text form-control" autocomplete="off" type="text" placeholder=[[groups:new-group.course-name]]></p>' +
						 '<p><input id="newGroupTrim" class="bootbox-input bootbox-input-text form-control" autocomplete="off" type="text" placeholder=[[groups:new-group.course-trim]]></p>' + 
						 '<p><input id="newGroupYear" class="bootbox-input bootbox-input-text form-control" autocomplete="off" type="text" placeholder=[[groups:new-group.course-year]]></p>',
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
                            if (name && name.length) {
                                api.post('/groups', {
                                    name: code + " | " + name + " | " + trimestre + " | " + year + " | " + "Prof. " + app.user.username,
                                }).then((res) => {
                                    ajaxify.go('groups/' + res.slug);
                                }).catch(alerts.error);
                            }
                        }
                    }
                }
            });
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
