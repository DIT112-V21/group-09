extends Spatial

func _ready() -> void:
	var timer: Timer = Timer.new()
	timer.wait_time = 2
	add_child(timer)
	
func init_cam_pos() -> Basis:
	return $Camera.global_transform
