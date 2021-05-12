extends RigidBody

onready var _wheels: Array = [$RightFront, $LeftFront, $RightMiddle, $LeftMiddle, $RightBack, $LeftBack]
onready var _cosmetic_wheels: Array = [
	$RightFront/wheel, $LeftFront/wheel, $RightMiddle/wheel, $LeftMiddle/wheel, $RightBack/wheel, $LeftBack/wheel 
]

onready var _rightw: Array = [$RightFront, $RightMiddle, $RightBack]
onready var _leftw: Array = [$LeftFront, $LeftMiddle, $LeftBack]

onready var lmotor: BrushedMotorGD = $"Attachments/Left BrushedMotor"
onready var rmotor: BrushedMotorGD = $"Attachments/Right BrushedMotor"
onready var lodo = $"Attachments/Left Odometer"
onready var rodo = $"Attachments/Right Odometer"

onready var attachments: Array = $Attachments.get_children()
var frozen = false

var _view = null

func set_view(view):
	_view = view
	for attach in attachments:
		if attach.has_method("set_view"):
			attach.set_view(view)


func _ready():
	lodo.forward_reference = self
	rodo.forward_reference = self


func freeze() -> void:
	mode = RigidBody.MODE_STATIC
	frozen = true


func unfreeze() -> void:
	mode = RigidBody.MODE_RIGID
	frozen = false
	# Trick the wheels to think they have not moved since last frame
	# so that velocity calculation dont freak out in case
	# we have been moved since
	for i in range(_wheels.size()):
		_wheels[i].prev_pos = _wheels[i].global_transform.origin


func _process(delta):
	$SpotLight.light_color.h += delta * 0.1


func _integrate_forces(state: PhysicsDirectBodyState) -> void:
	var key_direction: int = (
		int(Input.is_action_pressed("ui_up"))
		- int(Input.is_action_pressed("ui_down"))
	)
	for wheel in _rightw:
		if _view:
			wheel.throttle = rmotor.get_speed()
		else:
			wheel.throttle = 1 * key_direction * int(! Input.is_action_pressed("ui_right"))

	for wheel in _leftw:
		if _view:
			wheel.throttle = lmotor.get_speed()
		else:
			wheel.throttle = 1 * key_direction * int(! Input.is_action_pressed("ui_left"))

	for i in range(_wheels.size()):
		var wheel: Spatial = _cosmetic_wheels[i]
		_wheels[i].add_force(state)
		if _wheels[i].is_colliding():
			wheel.global_transform.origin = _wheels[i].get_collision_point()
			wheel.transform.origin *= Vector3(0,1,0)
		if wheel.get_children().size() > 0:
			wheel.get_child(0).rotate(Vector3(1,0,0), _wheels[i].throttle * PI/5)
		


